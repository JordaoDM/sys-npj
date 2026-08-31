const cron = require('node-cron');
const { Op } = require('sequelize');
const { agendamentoModel: Agendamento, usuarioModel: Usuario, processoModel: Processo, usuarioProcessoModel: UsuarioProcesso } = require('../models/indexModel');
const emailService = require('../services/emailService');

class AgendamentoCronJobs {
  
  static async buscarUsuariosVinculadosAoProcesso(processoId) {
    if (!processoId) return [];
    
    try {
      const usuariosVinculados = await UsuarioProcesso.findAll({
        where: { processo_id: processoId },
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nome', 'email']
          }
        ]
      });
      
      return usuariosVinculados.map(vinculo => vinculo.usuario);
    } catch (error) {
      console.error(`Erro ao buscar usuários vinculados ao processo ${processoId}:`, error);
      return [];
    }
  }

  static async enviarEmailParaTodosParticipantes(agendamento, subject, html) {
    const emailsEnviados = new Set();
    
    if (agendamento.usuario && agendamento.usuario.email) {
      try {
        await emailService.enviarEmail({
          to: [{ email: agendamento.usuario.email, name: agendamento.usuario.nome }],
          subject,
          html
        });
        emailsEnviados.add(agendamento.usuario.email);
        console.log(` E-mail enviado para criador ${agendamento.usuario.nome} (${agendamento.usuario.email})`);
      } catch (error) {
        console.error(`Erro ao enviar e-mail para criador ${agendamento.usuario.email}:`, error);
      }
    }
    
    if (agendamento.convidados && Array.isArray(agendamento.convidados)) {
      for (const convidado of agendamento.convidados) {
        if (convidado.email && 
            convidado.status === 'aceito' && 
            !emailsEnviados.has(convidado.email)) {
          try {
            await emailService.enviarEmail({
              to: [{ email: convidado.email, name: convidado.nome }],
              subject,
              html
            });
            emailsEnviados.add(convidado.email);
            console.log(` E-mail enviado para convidado ${convidado.nome || convidado.email}`);
          } catch (error) {
            console.error(`Erro ao enviar e-mail para convidado ${convidado.email}:`, error);
          }
        }
      }
    }
    
    console.log(` Total de e-mails enviados: ${emailsEnviados.size}`);
    return emailsEnviados.size;
  }
  static async marcarAgendamentos() {
    try {
      console.log(' Executando job para marcar agendamentos...');
      
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      
      const agendamentos = await Agendamento.findAll({
        where: {
          status: 'enviando_convites',
          data_aprovacao: {
            [Op.lte]: oneDayAgo
          }
        },
        include: [
          { model: Processo, as: 'processo' },
          { 
            model: Usuario, 
            as: 'usuario',
            attributes: ['id', 'nome', 'email', 'role_id', 'ativo']
          }
        ]
      });
      
      for (const agendamento of agendamentos) {
        agendamento.status = 'marcado';
        await agendamento.save();
        
        try {
          await this.enviarNotificacaoAgendamentoMarcado(agendamento);
        } catch (emailError) {
          console.error(`Erro ao enviar notificação para agendamento ${agendamento.id}:`, emailError);
        }
      }
      
      console.log(` ${agendamentos.length} agendamentos marcados como confirmados`);
    } catch (error) {
      console.error(' Erro no job de marcar agendamentos:', error);
    }
  }
  
  static async enviarLembretesDodia() {
    try {
      console.log(' Executando job para lembretes do dia...');
      
      const hoje = new Date();
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      const fimHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
      
      const agendamentos = await Agendamento.findAll({
        where: {
          status: 'marcado',
          data_inicio: {
            [Op.between]: [inicioHoje, fimHoje]
          }
        },
        include: [
          { model: Processo, as: 'processo' },
          { 
            model: Usuario, 
            as: 'usuario',
            attributes: ['id', 'nome', 'email', 'role_id', 'ativo']
          }
        ]
      });
      
      for (const agendamento of agendamentos) {
        try {
          await this.enviarLembreteDodia(agendamento);
        } catch (emailError) {
          console.error(`Erro ao enviar lembrete para agendamento ${agendamento.id}:`, emailError);
        }
      }
      
      console.log(` Lembretes enviados para ${agendamentos.length} agendamentos`);
    } catch (error) {
      console.error(' Erro no job de lembretes do dia:', error);
    }
  }

  static async enviarLembretes1HoraAntes() {
    try {
      console.log(' Executando job para lembretes 1 hora antes...');
      
      const agora = new Date();
      const umaHoraDepois = new Date(agora.getTime() + (60 * 60 * 1000));
      
      const agendamentos = await Agendamento.findAll({
        where: {
          status: 'marcado',
          data_inicio: {
            [Op.between]: [agora, umaHoraDepois]
          },
            lembrete_1h_enviado: { [Op.ne]: true }
        },
        include: [
          { model: Processo, as: 'processo' },
          { 
            model: Usuario, 
            as: 'usuario',
            attributes: ['id', 'nome', 'email', 'role_id', 'ativo']
          }
        ]
      });
      
      for (const agendamento of agendamentos) {
        try {
          await this.enviarLembrete1HoraAntes(agendamento);
          agendamento.lembrete_1h_enviado = true;
          await agendamento.save();
        } catch (emailError) {
          console.error(`Erro ao enviar lembrete 1h antes para agendamento ${agendamento.id}:`, emailError);
        }
      }
      
      console.log(` Lembretes 1h antes enviados para ${agendamentos.length} agendamentos`);
    } catch (error) {
      console.error(' Erro no job de lembretes 1h antes:', error);
    }
  }
  
  static async finalizarAgendamentos() {
    try {
      console.log(' Executando job para finalizar agendamentos...');
      
      const agora = new Date();
      
      const agendamentos = await Agendamento.findAll({
        where: {
          status: 'marcado',
          data_fim: {
            [Op.lt]: agora
          }
        }
      });
      
      for (const agendamento of agendamentos) {
        agendamento.status = 'finalizado';
        await agendamento.save();
      }
      
      console.log(` ${agendamentos.length} agendamentos finalizados`);
    } catch (error) {
      console.error(' Erro no job de finalizar agendamentos:', error);
    }
  }
  
  static async enviarNotificacaoAgendamentoMarcado(agendamento) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #28a745;"> Agendamento Confirmado</h2>
        <p><strong>Título:</strong> ${agendamento.titulo}</p>
        <p><strong>Data/Hora:</strong> ${new Date(agendamento.data_inicio).toLocaleString('pt-BR')} - ${new Date(agendamento.data_fim).toLocaleString('pt-BR')}</p>
        <p><strong>Local:</strong> ${agendamento.local || 'Não informado'}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #d4edda; border-left: 4px solid #28a745;">
          <p><strong>Seu agendamento foi confirmado!</strong> Você receberá um lembrete no dia do evento.</p>
        </div>
        
        ${agendamento.processo ? `<p><strong>Processo:</strong> ${agendamento.processo.numero_processo} - ${agendamento.processo.titulo}</p>` : ''}
      </div>
    `;
    
    const subject = `Agendamento Confirmado - ${agendamento.titulo}`;
    return await this.enviarEmailParaTodosParticipantes(agendamento, subject, html);
  }
  
  static async enviarLembrete1HoraAntes(agendamento) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #dc3545;"> Lembrete Urgente: Agendamento em 1 Hora</h2>
        <p><strong>Título:</strong> ${agendamento.titulo}</p>
        <p><strong>Início:</strong> ${new Date(agendamento.data_inicio).toLocaleString('pt-BR')}</p>
        <p><strong>Término:</strong> ${new Date(agendamento.data_fim).toLocaleString('pt-BR')}</p>
        <p><strong>Local:</strong> ${agendamento.local || 'Não informado'}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #f8d7da; border-left: 4px solid #dc3545;">
          <p><strong> ATENÇÃO!</strong> Seu agendamento começará em aproximadamente 1 hora. Prepare-se e dirija-se ao local!</p>
        </div>
        
        ${agendamento.processo ? `<p><strong>Processo:</strong> ${agendamento.processo.numero_processo} - ${agendamento.processo.titulo}</p>` : ''}
        
        <p style="margin-top: 20px; font-size: 12px; color: #666;">
          Este é um lembrete automático. Por favor, não responda a este e-mail.
        </p>
      </div>
    `;
    
    const subject = ` URGENTE: ${agendamento.titulo} em 1 hora`;
    return await this.enviarEmailParaTodosParticipantes(agendamento, subject, html);
  }

  static async enviarLembreteDodia(agendamento) {
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #ffc107;"> Lembrete: Agendamento Hoje</h2>
        <p><strong>Título:</strong> ${agendamento.titulo}</p>
        <p><strong>Horário:</strong> ${new Date(agendamento.data_inicio).toLocaleString('pt-BR')} - ${new Date(agendamento.data_fim).toLocaleString('pt-BR')}</p>
        <p><strong>Local:</strong> ${agendamento.local || 'Não informado'}</p>
        
        <div style="margin: 20px 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107;">
          <p><strong>Não esqueça!</strong> Seu agendamento é hoje. Prepare-se e chegue no horário.</p>
        </div>
        
        ${agendamento.processo ? `<p><strong>Processo:</strong> ${agendamento.processo.numero_processo} - ${agendamento.processo.titulo}</p>` : ''}
      </div>
    `;
    
    const subject = `Lembrete: ${agendamento.titulo} - Hoje`;
    return await this.enviarEmailParaTodosParticipantes(agendamento, subject, html);
  }
  
  static iniciar() {
    console.log(' Iniciando cron jobs de agendamentos...');
    
    cron.schedule('0 */6 * * *', () => {
      this.marcarAgendamentos();
    });
    
    cron.schedule('0 8 * * *', () => {
      this.enviarLembretesDodia();
    });
    
    cron.schedule('*/15 * * * *', () => {
      this.enviarLembretes1HoraAntes();
    });
    
    cron.schedule('0 * * * *', () => {
      this.finalizarAgendamentos();
    });
    
    console.log(' Cron jobs de agendamentos iniciados com sucesso');
  }
  
}

module.exports = AgendamentoCronJobs;
