const cron = require('node-cron');
const { Op } = require('sequelize');
const Agendamento = require('../models/agendamentoModel');
const Usuario = require('../models/usuarioModel');
const Processo = require('../models/processoModel');
const ConfiguracaoLembrete = require('../models/configuracaoLembreteModel');
const emailService = require('../services/emailService');
const { fromZonedTime, toZonedTime } = require('date-fns-tz');

class LembreteJob {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  iniciar() {
    console.log(' Iniciando job unificado de lembretes de agendamentos...');
    this.job = cron.schedule('*/15 * * * *', () => this.executar());
    console.log(' Job unificado de lembretes iniciado (a cada 15 minutos)');
  }

  async executar(agora = new Date()) {
    if (this.isRunning) {
      console.log(' Job de lembretes já está em execução, pulando...');
      return;
    }

    this.isRunning = true;
    try {
      try {
        const configuracao = await this.obterConfiguracao();
        if (configuracao.lembrete_24h_ativo) {
          await this.enviarLembretes24Horas(agora);
        }
        if (configuracao.lembrete_dia_ativo) {
          await this.enviarLembretesDoDia(agora, configuracao);
        }
        if (configuracao.lembrete_antecipado_ativo) {
          await this.enviarLembretesAntecipados(agora, configuracao.antecedencia_minutos);
        }
      } catch (error) {
        console.error(' Configuração de lembretes indisponível; envios ignorados neste ciclo:', error.message);
      }

      try {
        await this.verificarConvitesExpirados(agora);
      } catch (error) {
        console.error(' Erro ao verificar convites expirados:', error.message);
      }
    } catch (error) {
      console.error(' Erro geral no job unificado de lembretes:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async obterConfiguracao() {
    const [configuracao] = await ConfiguracaoLembrete.findOrCreate({
      where: { id: 1 },
      defaults: ConfiguracaoLembrete.padrao
    });
    return configuracao.get ? configuracao.get({ plain: true }) : configuracao;
  }

  includesParticipantes() {
    return [
      { model: Processo, as: 'processo', attributes: ['id', 'numero_processo', 'titulo'], required: false },
      { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'], required: false }
    ];
  }

  obterDestinatarios(agendamento) {
    const destinatarios = new Map();
    const adicionar = (email, nome) => {
      const normalizado = email?.trim().toLowerCase();
      if (normalizado && !destinatarios.has(normalizado)) {
        destinatarios.set(normalizado, { email: normalizado, nome: nome || 'Participante' });
      }
    };

    adicionar(agendamento.usuario?.email, agendamento.usuario?.nome);
    adicionar(agendamento.email_lembrete, 'Participante');
    if (Array.isArray(agendamento.convidados)) {
      agendamento.convidados
        .filter((convidado) => convidado.status === 'aceito')
        .forEach((convidado) => adicionar(convidado.email, convidado.nome || 'Convidado'));
    }
    return [...destinatarios.values()];
  }

  async enviarParaParticipantes(agendamento) {
    const destinatarios = this.obterDestinatarios(agendamento);
    for (const destinatario of destinatarios) {
      await emailService.enviarLembreteAgendamento(
        agendamento,
        destinatario.email,
        destinatario.nome
      );
    }
    return destinatarios.length;
  }

  async processarAgendamentos(where, campoControle, descricao) {
    const agendamentos = await Agendamento.findAll({
      where: { status: 'marcado', ...where, [campoControle]: false },
      include: this.includesParticipantes()
    });

    for (const agendamento of agendamentos) {
      try {
        const total = await this.enviarParaParticipantes(agendamento);
        if (total > 0) {
          agendamento[campoControle] = true;
          await agendamento.save();
          console.log(` ${descricao} enviado para ${total} destinatário(s), agendamento ${agendamento.id}`);
        }
      } catch (error) {
        console.error(` Erro ao enviar ${descricao} do agendamento ${agendamento.id}:`, error.message);
      }
    }
  }

  async enviarLembretes24Horas(agora = new Date()) {
    const limite = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    await this.processarAgendamentos({
      data_inicio: { [Op.between]: [agora, limite] }
    }, 'lembrete_enviado', 'lembrete de 24 horas');
  }

  async enviarLembretesDoDia(agora = new Date(), configuracao = ConfiguracaoLembrete.padrao) {
    const fuso = configuracao.fuso_horario;
    const agoraNoFuso = toZonedTime(agora, fuso);
    const [hora, minuto] = String(configuracao.horario_lembrete_dia).split(':').map(Number);
    const minutosAgora = agoraNoFuso.getHours() * 60 + agoraNoFuso.getMinutes();
    const minutosConfigurados = hora * 60 + minuto;
    if (minutosAgora < minutosConfigurados) return;

    const inicioLocal = new Date(
      agoraNoFuso.getFullYear(), agoraNoFuso.getMonth(), agoraNoFuso.getDate(), 0, 0, 0, 0
    );
    const fimLocal = new Date(
      agoraNoFuso.getFullYear(), agoraNoFuso.getMonth(), agoraNoFuso.getDate(), 23, 59, 59, 999
    );
    const inicioHoje = fromZonedTime(inicioLocal, fuso);
    const fimHoje = fromZonedTime(fimLocal, fuso);
    const inicioConsulta = agora > inicioHoje ? agora : inicioHoje;
    await this.processarAgendamentos({
      data_inicio: { [Op.between]: [inicioConsulta, fimHoje] }
    }, 'lembrete_dia_enviado', 'lembrete do dia');
  }

  async enviarLembretesAntecipados(agora = new Date(), antecedenciaMinutos = 60) {
    const limite = new Date(agora.getTime() + Number(antecedenciaMinutos) * 60 * 1000);
    await this.processarAgendamentos({
      data_inicio: { [Op.between]: [agora, limite] }
    }, 'lembrete_1h_enviado', `lembrete de ${antecedenciaMinutos} minutos`);
  }

  async testarManual(agora = new Date()) {
    await this.executar(agora);
  }

  async executarManual(agora = new Date()) {
    await this.executar(agora);
  }

  parar() {
    if (this.job) this.job.stop();
  }

  isJobRunning() {
    return this.isRunning;
  }

  getStatus() {
    return {
      ativo: Boolean(this.job),
      executando: this.isRunning,
      proximaExecucao: this.job?.nextDate?.() || null
    };
  }

  async verificarConvitesExpirados(agora = new Date()) {
    const agendamentos = await Agendamento.findAll({
      where: {
        status: 'enviando_convites',
        data_convites_enviados: { [Op.not]: null }
      }
    });

    for (const agendamento of agendamentos) {
      const horasPassadas = (agora - new Date(agendamento.data_convites_enviados)) / (1000 * 60 * 60);
      if (horasPassadas >= 24) await agendamento.verificarAutoMarcacao();
    }
  }
}

module.exports = new LembreteJob();
