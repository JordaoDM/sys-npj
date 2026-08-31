const cron = require('node-cron');
const Agendamento = require('../models/agendamentoModel');
const emailService = require('../services/emailService');

class LembreteJob {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  iniciar() {
    console.log(' Iniciando job automático de lembretes de agendamentos...');
    
    this.job = cron.schedule('0 0 */1 * * *', async () => {
      if (this.isRunning) {
        console.log(' Job de lembretes já está em execução, pulando...');
        return;
      }

      await this.executarLembretes();
      await this.verificarConvitesExpirados();
    }, {
      scheduled: true,
      timezone: 'America/Cuiaba'
    });

    console.log(' Job de lembretes iniciado com sucesso (executa a cada 1 hora)');
  }

  async testarManual() {
    console.log(' Executando teste manual do job de lembretes...');
    await this.executarLembretes();
  }

  parar() {
    if (this.job) {
      this.job.stop();
      console.log(' Job de lembretes parado');
    }
  }

  async executarLembretes() {
    this.isRunning = true;
    console.log(' Iniciando execução de lembretes de agendamentos...');

    try {
      const agora = new Date();
      const em24h = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
      
      const { Op } = require('sequelize');
      const Usuario = require('../models/usuarioModel');
      const Processo = require('../models/processoModel');
      
      const agendamentos = await Agendamento.findAll({
        where: {
          data_inicio: {
            [Op.between]: [agora, em24h]
          },
          lembrete_enviado: false,
          status: {
            [Op.in]: ['pendente', 'confirmado']
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
      
      if (agendamentos.length === 0) {
        console.log(' Nenhum agendamento pendente de lembrete encontrado');
        return;
      }

      console.log(` ${agendamentos.length} agendamento(s) encontrado(s) para envio de lembrete`);

      let sucessos = 0;
      let erros = 0;

      for (const agendamento of agendamentos) {
        try {
          console.log(` Enviando lembrete para agendamento: ${agendamento.titulo} (ID: ${agendamento.id})`);
          
          let lembreteEnviado = false;
          
          if (agendamento.usuario && agendamento.usuario.email) {
            await emailService.enviarLembreteAgendamento(
              agendamento, 
              agendamento.usuario.email, 
              agendamento.usuario.nome
            );
            lembreteEnviado = true;
          }
          
          if (agendamento.email_lembrete) {
            await emailService.enviarLembreteAgendamento(
              agendamento, 
              agendamento.email_lembrete, 
              'Participante'
            );
            lembreteEnviado = true;
          }
          
          if (agendamento.convidados && Array.isArray(agendamento.convidados)) {
            for (const convidado of agendamento.convidados) {
              if (convidado.status === 'aceito' && convidado.email) {
                await emailService.enviarLembreteAgendamento(
                  agendamento, 
                  convidado.email, 
                  convidado.nome || 'Convidado'
                );
                lembreteEnviado = true;
              }
            }
          }
          
          if (lembreteEnviado) {
            agendamento.lembrete_enviado = true;
            await agendamento.save();
            sucessos++;
            console.log(` Lembrete enviado com sucesso para agendamento ID: ${agendamento.id}`);
          } else {
            console.log(` Nenhum destinatário válido para agendamento ID: ${agendamento.id}`);
          }
          
        } catch (error) {
          erros++;
          console.error(` Erro ao enviar lembrete para agendamento ID: ${agendamento.id}`, error.message);
        }
      }

      console.log(`Resumo do job de lembretes:`);
      console.log(`Sucessos: ${sucessos}`);
      console.log(`Erros: ${erros}`);
      console.log(`Total processados: ${agendamentos.length}`);

    } catch (error) {
      console.error('Erro geral no job de lembretes:', error);
    } finally {
      this.isRunning = false;
      console.log('Execução de lembretes finalizada');
    }
  }

  async executarManual() {
    console.log(' Executando job de lembretes manualmente...');
    await this.executarLembretes();
  }

  isJobRunning() {
    return this.isRunning;
  }

  getStatus() {
    return {
      ativo: this.job ? this.job.running : false,
      executando: this.isRunning,
      proximaExecucao: this.job ? this.job.nextDate() : null
    };
  }

  async verificarConvitesExpirados() {
    try {
      console.log(' Verificando convites expirados...');
      
      const agendamentos = await Agendamento.findAll({
        where: {
          status: 'enviando_convites',
          data_convites_enviados: {
            [require('sequelize').Op.not]: null
          }
        }
      });

      let processados = 0;
      
      for (const agendamento of agendamentos) {
        const horasPassadas = (new Date() - new Date(agendamento.data_convites_enviados)) / (1000 * 60 * 60);
        
        if (horasPassadas >= 24) {
          await agendamento.verificarAutoMarcacao();
          processados++;
          console.log(` Convites expirados processados para agendamento ${agendamento.id}`);
        }
      }

      console.log(` Verificação de convites expirados concluída: ${processados} agendamentos processados`);
      
    } catch (error) {
      console.error(' Erro ao verificar convites expirados:', error);
    }
  }
}

const lembreteJob = new LembreteJob();

module.exports = lembreteJob;
