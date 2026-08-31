
const { DataTypes, Model, Sequelize } = require('sequelize');
const sequelize = require('../utils/sequelize');

class Agendamento extends Model {
  static associate(models) {
    Agendamento.belongsTo(models.processoModel, {
      foreignKey: 'processo_id',
      as: 'processo'
    });
    Agendamento.belongsTo(models.usuarioModel, {
      foreignKey: 'criado_por',
      as: 'usuario'
    });
  }

  marcarComoEnviandoConvites() {
    this.status = 'enviando_convites';
    return this.save();
  }
  marcarComoMarcado() {
    this.status = 'marcado';
    return this.save();
  }
  
  async verificarAutoMarcacao() {
    console.log(` [DEBUG] Verificando auto marcação para agendamento ${this.id} (status atual: ${this.status})`);
    
    if (this.status === 'cancelado' || this.status === 'finalizado') {
      console.log(`️  [DEBUG] Agendamento ${this.id} já está finalizado/cancelado - ignorando`);
      return false;
    }
    
    let convidados = this.convidados || [];
    
    if (!Array.isArray(convidados)) {
      try {
        convidados = JSON.parse(convidados);
      } catch (e) {
        console.log(`️  [DEBUG] Erro ao fazer parse dos convidados do agendamento ${this.id}:`, e.message);
        convidados = [];
      }
    }
    
    console.log(` [DEBUG] Agendamento ${this.id} tem ${convidados.length} convidados`);
    
    if (!Array.isArray(convidados) || convidados.length === 0) {
      if (this.status === 'pendente') {
        this.status = 'marcado';
        await this.save();
        console.log(` Agendamento ${this.id} marcado automaticamente - sem convidados`);
        return true;
      }
    }
    
    const convidadosComEmail = convidados.filter(c => c.email && c.email.trim() !== '');
    console.log(` [DEBUG] Agendamento ${this.id} tem ${convidadosComEmail.length} convidados com email válido`);
    
    if (convidadosComEmail.length === 0 && this.status === 'pendente') {
      this.status = 'marcado';
      await this.save();
      console.log(` Agendamento ${this.id} marcado automaticamente - nenhum email válido`);
      return true;
    }
    
    convidadosComEmail.forEach((c, i) => {
      console.log(` [DEBUG] Convidado ${i + 1}: ${c.email} - Status: ${c.status}`);
    });
    
    if (this.data_convites_enviados) {
      const horasPassadas = (new Date() - new Date(this.data_convites_enviados)) / (1000 * 60 * 60);
      console.log(` [DEBUG] Convites enviados há ${horasPassadas.toFixed(2)} horas`);
      
      if (horasPassadas >= 24) {
        let mudancas = false;
        convidadosComEmail.forEach(convidado => {
          if (convidado.status === 'pendente') {
            convidado.status = 'aceito';
            convidado.data_resposta = new Date();
            convidado.resposta_automatica = true;
            mudancas = true;
          }
        });
        
        if (mudancas) {
          this.convidados = convidadosComEmail;
          await this.save();
          console.log(` Agendamento ${this.id} - convites expirados considerados como aceitos`);
        }
      }
    }
    
    const statusConvidados = convidadosComEmail.map(c => c.status);
    const todosAceitaram = convidadosComEmail.every(c => c.status === 'aceito');
    const todosRecusaram = convidadosComEmail.every(c => c.status === 'recusado');
    const temPendentes = convidadosComEmail.some(c => c.status === 'pendente');
    
    console.log(` [DEBUG] Análise dos status - Todos aceitaram: ${todosAceitaram}, Todos recusaram: ${todosRecusaram}, Tem pendentes: ${temPendentes}`);
    console.log(` [DEBUG] Status dos convidados: [${statusConvidados.join(', ')}]`);
    
    if (todosAceitaram && convidadosComEmail.length > 0 && this.status !== 'marcado') {
      this.status = 'marcado';
      await this.save();
      console.log(` Agendamento ${this.id} marcado automaticamente - todos os convidados aceitaram`);
      
      try {
        const emailService = require('../services/emailService');
        await emailService.enviarNotificacaoAgendamentoConfirmado(this);
        console.log(` Notificação de confirmação enviada para agendamento ${this.id}`);
      } catch (error) {
        console.error(` Erro ao enviar notificação de confirmação:`, error);
      }
      
      return true;
    }
    
    if (todosRecusaram && convidadosComEmail.length > 0 && this.status !== 'cancelado') {
      this.status = 'cancelado';
      this.cancelado_automaticamente = true;
      this.motivo_cancelamento = 'Todos os convidados recusaram o convite';
      await this.save();
      console.log(` Agendamento ${this.id} cancelado automaticamente - todos recusaram`);
      
      try {
        const emailService = require('../services/emailService');
        await emailService.enviarNotificacaoCancelamentoAutomatico(this);
      } catch (error) {
        console.error(`Erro ao enviar notificação de cancelamento:`, error);
      }
      
      return true;
    }
    
    const temAceites = convidadosComEmail.some(c => c.status === 'aceito');
    const temRecusas = convidadosComEmail.some(c => c.status === 'recusado');
    const todosResponderam = convidadosComEmail.every(c => c.status !== 'pendente');
    
    if (temAceites && temRecusas && todosResponderam && this.status === 'pendente') {
      this.situacao_mista = true;
      await this.save();
      console.log(`️ Agendamento ${this.id} tem aceites e recusas - notificando admin`);
      
      try {
        const emailService = require('../services/emailService');
        await emailService.enviarNotificacaoSituacaoMista(this);
      } catch (error) {
        console.error(`Erro ao enviar notificação de situação mista:`, error);
      }
      
      return true;
    }
    
    return false;
  }

  temRejeicoesPendentes() {
    const convidados = this.convidados || [];
    return convidados.some(c => c.status === 'recusado') && !this.admin_notificado_rejeicoes;
  }

  async marcarAdminNotificado() {
    this.admin_notificado_rejeicoes = true;
    return this.save();
  }

  convitesExpiraram() {
    if (!this.data_convites_enviados) return false;
    const horasPassadas = (new Date() - new Date(this.data_convites_enviados)) / (1000 * 60 * 60);
    return horasPassadas >= 24;
  }

  adicionarConvidado(email, nome = null) {
    let convidados = this.convidados || [];
    
    const emailExiste = convidados.some(c => c.email.toLowerCase() === email.toLowerCase());
    if (emailExiste) {
      throw new Error(`Email ${email} já foi convidado para este agendamento`);
    }
    
    convidados.push({
      email: email.toLowerCase(),
      nome: nome,
      status: 'pendente',
      data_convite: new Date(),
      justificativa: null,
      data_resposta: null
    });
    
    this.convidados = convidados;
    return this;
  }

  async marcarConvitesEnviados() {
    this.status = 'enviando_convites';
    this.data_convites_enviados = new Date();
    return this.save();
  }
  marcarComoFinalizado() {
    this.status = 'finalizado';
    return this.save();
  }
  cancelar() {
    this.status = 'cancelado';
    return this.save();
  }
  marcarLembreteEnviado() {
    this.lembrete_enviado = true;
    return this.save();
  }

  static findByUsuario(usuarioId) {
    return Agendamento.findAll({
      where: {
        [Sequelize.Op.or]: [
          { criado_por: usuarioId },
          Sequelize.literal(`JSON_CONTAINS(convidados, '{"email": "${usuarioId}"}')`)
        ]
      },
      order: [['data_inicio', 'ASC']],
      include: [
        { model: sequelize.models.processoModel, as: 'processo', attributes: ['id', 'numero_processo', 'titulo'] },
        { model: sequelize.models.usuarioModel, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });
  }

  static findByUsuarioEmail(email) {
    return Agendamento.findAll({
      where: {
        [Sequelize.Op.or]: [
          Sequelize.literal(`JSON_CONTAINS(convidados, JSON_OBJECT('email', '${email}'))`),
          { '$usuario.email$': email }
        ]
      },
      order: [['data_inicio', 'ASC']],
      include: [
        { model: sequelize.models.processoModel, as: 'processo', attributes: ['id', 'numero_processo', 'titulo'] },
        { model: sequelize.models.usuarioModel, as: 'usuario', attributes: ['id', 'nome', 'email'] }
      ]
    });
  }

  static findByProcesso(processoId) {
    return Agendamento.findAll({
      where: { processo_id: processoId },
      order: [['data_inicio', 'ASC']],
      include: [
        { 
          association: 'usuario',
          attributes: ['id', 'nome', 'email'],
          required: false
        }
      ]
    });
  }

  static findByPeriodo(dataInicio, dataFim, usuarioId = null) {
    const where = {
      data_inicio: {
        [Sequelize.Op.between]: [dataInicio, dataFim]
      }
    };
    if (usuarioId) {
      where.criado_por = usuarioId;
    }
    return Agendamento.findAll({
      where,
      order: [['data_inicio', 'ASC']],
      include: [
        { 
          model: sequelize.models.processoModel, 
          as: 'processo', 
          attributes: ['id', 'numero_processo', 'titulo'],
          required: false
        },
        { 
          model: sequelize.models.usuarioModel, 
          as: 'usuario', 
          attributes: ['id', 'nome', 'email'],
          required: false
        }
      ]
    });
  }

  static findPendentesLembrete() {
    const agora = new Date();
    const em24h = new Date();
    em24h.setHours(em24h.getHours() + 24);
    
    const Processo = require('./processoModel');
    const Usuario = require('./usuarioModel');
    return Agendamento.findAll({
      where: {
        data_inicio: {
          [Sequelize.Op.between]: [agora, em24h]
        },
        lembrete_enviado: false,
        [Sequelize.Op.or]: [
          { email_lembrete: { [Sequelize.Op.not]: null } },
          Sequelize.literal('JSON_LENGTH(convidados) > 0')
        ],
        status: {
          [Sequelize.Op.in]: ['enviando_convites', 'marcado']
        }
      },
      include: [
        { 
          model: Processo, 
          as: 'processo', 
          attributes: ['id', 'numero_processo', 'titulo'],
          required: false
        },
        { 
          model: Usuario, 
          as: 'usuario', 
          attributes: ['id', 'nome', 'email'],
          required: false
        }
      ]
    });
  }

  adicionarConvidado(email, nome = null) {
    const convidados = this.convidados || [];
    const jaConvidado = convidados.find(c => c.email === email);
    
    if (!jaConvidado) {
      convidados.push({
        email: email,
        nome: nome,
        status: 'pendente',
        convidado_em: new Date()
      });
      this.convidados = convidados;
    }
    return this;
  }

  async aceitarConvite(email) {
    console.log(` [DEBUG] Tentativa de aceitar convite - Agendamento: ${this.id}, Email: ${email}`);
    
    if (this.convitesExpiraram()) {
      throw new Error('Este convite expirou. Links de convite são válidos por apenas 24 horas.');
    }

    if (this.status === 'cancelado') {
      throw new Error('Este agendamento foi cancelado.');
    }

    let convidados = this.convidados;
    if (!Array.isArray(convidados)) {
      try {
        convidados = JSON.parse(convidados);
      } catch {
        convidados = [];
      }
    }
    
    console.log(` [DEBUG] Processando ${convidados.length} convidados`);
    
    const convidado = convidados.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!convidado) {
      console.log(` [DEBUG] Email ${email} não encontrado nos convidados`);
      throw new Error('Email não encontrado na lista de convidados');
    }

    console.log(` [DEBUG] Convidado encontrado: ${convidado.email} - Status atual: ${convidado.status}`);

    if (convidado.status !== 'pendente') {
      throw new Error(`Você já respondeu a este convite como: ${convidado.status}`);
    }

    convidado.status = 'aceito';
    convidado.data_resposta = new Date();
    
    this.convidados = convidados;
    this.changed('convidados', true);
    await this.save();
    console.log(` [DEBUG] Convite aceito com sucesso para ${email} no agendamento ${this.id}`);
    
    await this.reload();
    console.log(` [DEBUG] Dados recarregados - Status atual: ${this.status}`);
    
    console.log(` [DEBUG] Iniciando verificação automática de marcação...`);
    await this.verificarAutoMarcacao();
    
    return this;
  }

  async recusarConvite(email, justificativa = null) {
    console.log(` [DEBUG] Tentativa de recusar convite - Agendamento: ${this.id}, Email: ${email}`);
    
    if (this.convitesExpiraram()) {
      throw new Error('Este convite expirou. Links de convite são válidos por apenas 24 horas.');
    }

    if (this.status === 'cancelado') {
      throw new Error('Este agendamento foi cancelado.');
    }

    if (!justificativa || justificativa.trim() === '') {
      throw new Error('Justificativa é obrigatória para recusar um convite');
    }

    let convidados = this.convidados;
    if (!Array.isArray(convidados)) {
      try {
        convidados = JSON.parse(convidados);
      } catch {
        convidados = [];
      }
    }
    
    console.log(` [DEBUG] Processando ${convidados.length} convidados`);
    
    const convidado = convidados.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!convidado) {
      console.log(` [DEBUG] Email ${email} não encontrado nos convidados`);
      throw new Error('Email não encontrado na lista de convidados');
    }

    console.log(` [DEBUG] Convidado encontrado: ${convidado.email} - Status atual: ${convidado.status}`);

    if (convidado.status !== 'pendente') {
      throw new Error(`Você já respondeu a este convite como: ${convidado.status}`);
    }

    convidado.status = 'recusado';
    convidado.justificativa = justificativa;
    convidado.data_resposta = new Date();
    
    this.convidados = convidados;
    this.changed('convidados', true);
    await this.save();
    console.log(` [DEBUG] Convite recusado com sucesso para ${email} no agendamento ${this.id}`);
    
    await this.reload();
    console.log(` [DEBUG] Dados recarregados - Status atual: ${this.status}`);
    
    console.log(` [DEBUG] Iniciando verificação automática de marcação...`);
    await this.verificarAutoMarcacao();
    
    return this;
  }
}

Agendamento.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  processo_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      isInt: {
        msg: 'ID do processo deve ser um número inteiro'
      }
    }
  },
  titulo: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Título é obrigatório'
      },
      len: {
        args: [3, 255],
        msg: 'Título deve ter entre 3 e 255 caracteres'
      }
    }
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  data_inicio: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Data de início deve ser uma data válida'
      }
    }
  },
  data_fim: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Data de fim deve ser uma data válida'
      },
      isAfterStart(value) {
        if (value < this.data_inicio) {
          throw new Error('Data de fim deve ser posterior à data de início');
        }
      }
    }
  },
  local: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  tipo: {
    type: DataTypes.ENUM('reuniao', 'audiencia', 'prazo', 'outro'),
    allowNull: false,
    defaultValue: 'reuniao',
    validate: {
      isIn: {
        args: [['reuniao', 'audiencia', 'prazo', 'outro']],
        msg: 'Tipo deve ser: reuniao, audiencia, prazo ou outro'
      }
    }
  },
  status: {
    type: DataTypes.ENUM('em_analise', 'pendente', 'enviando_convites', 'marcado', 'cancelado', 'finalizado'),
    allowNull: false,
    defaultValue: 'em_analise',
    validate: {
      isIn: {
        args: [['em_analise', 'pendente', 'enviando_convites', 'marcado', 'cancelado', 'finalizado']],
        msg: 'Status deve ser: em_analise, pendente, enviando_convites, marcado, cancelado ou finalizado'
      }
    }
  },
  email_lembrete: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Email deve ter formato válido'
      }
    }
  },
  convidados: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: 'Array de objetos com {email, status: pendente|aceito|recusado, nome?, justificativa?, data_resposta?, data_convite?, link_expira?}'
  },
  lembrete_enviado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  data_convites_enviados: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data quando os convites foram enviados para calcular expiração de 24h'
  },
  admin_notificado_rejeicoes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se admin já foi notificado sobre rejeições'
  },
  cancelado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID do usuário que cancelou o agendamento'
  },
  cancelado_automaticamente: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se foi cancelado automaticamente quando todos recusaram'
  },
  motivo_cancelamento: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Motivo do cancelamento (manual ou automático)'
  },
  situacao_mista: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Se há aceites e recusas simultaneamente (precisa ação admin)'
  },
  lembrete_1h_enviado: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Lembrete 1 hora antes foi enviado'
  },
  criado_por: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Usuário criador é obrigatório'
      }
    }
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  motivo_recusa: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Motivo da recusa quando o responsável rejeita o agendamento'
  },
  aprovado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id'
    },
    comment: 'Usuário que aprovou o agendamento'
  },
  data_aprovacao: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Data em que o agendamento foi aprovado'
  }
}, {
  sequelize,
  modelName: 'Agendamento',
  tableName: 'agendamentos',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  indexes: [
    { fields: ['processo_id'] },
    { fields: ['data_inicio', 'data_fim'] },
    { fields: ['status'] },
    { fields: ['criado_por'] }
  ]
});

module.exports = Agendamento;
