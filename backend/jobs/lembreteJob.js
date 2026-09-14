const cron = require('node-cron');
const { Op } = require('sequelize');
const Agendamento = require('../models/agendamentoModel');
const Usuario = require('../models/usuarioModel');
const Processo = require('../models/processoModel');
const emailService = require('../services/emailService');

const TIMEZONE = process.env.TZ || 'America/Cuiaba';

class LembreteJob {
  constructor() {
    this.isRunning = false;
    this.job = null;
  }

  iniciar() {
    console.log(' Iniciando job unificado de lembretes de agendamentos...');
    this.job = cron.schedule('*/15 * * * *', () => this.executar(), {
      scheduled: true,
      timezone: TIMEZONE
    });
    console.log(` Job unificado de lembretes iniciado (a cada 15 minutos, fuso ${TIMEZONE})`);
  }

  async executar(agora = new Date()) {
    if (this.isRunning) {
      console.log(' Job de lembretes já está em execução, pulando...');
      return;
    }

    this.isRunning = true;
    try {
      await this.enviarLembretes24Horas(agora);
      await this.enviarLembretesDoDia(agora);
      await this.enviarLembretes1Hora(agora);
      await this.verificarConvitesExpirados(agora);
    } catch (error) {
      console.error(' Erro geral no job unificado de lembretes:', error);
    } finally {
      this.isRunning = false;
    }
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

  async enviarLembretesDoDia(agora = new Date()) {
    if (agora.getHours() !== 8) return;
    const inicioHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const fimHoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
    await this.processarAgendamentos({
      data_inicio: { [Op.between]: [inicioHoje, fimHoje] }
    }, 'lembrete_dia_enviado', 'lembrete do dia');
  }

  async enviarLembretes1Hora(agora = new Date()) {
    const limite = new Date(agora.getTime() + 60 * 60 * 1000);
    await this.processarAgendamentos({
      data_inicio: { [Op.between]: [agora, limite] }
    }, 'lembrete_1h_enviado', 'lembrete de 1 hora');
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
