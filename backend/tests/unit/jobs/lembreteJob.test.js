jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../../models/agendamentoModel', () => ({ findAll: jest.fn() }));
jest.mock('../../../models/usuarioModel', () => ({}));
jest.mock('../../../models/processoModel', () => ({}));
jest.mock('../../../services/emailService', () => ({
  enviarLembreteAgendamento: jest.fn()
}));

const Agendamento = require('../../../models/agendamentoModel');
const emailService = require('../../../services/emailService');
const lembreteJob = require('../../../jobs/lembreteJob');

describe('LembreteJob unificado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lembreteJob.isRunning = false;
  });

  test('remove destinatários duplicados e ignora convidados não aceitos', () => {
    const destinatarios = lembreteJob.obterDestinatarios({
      usuario: { email: 'Pessoa@NPJ.test', nome: 'Pessoa' },
      email_lembrete: 'pessoa@npj.test',
      convidados: [
        { email: 'CONVIDADO@NPJ.test', nome: 'Convidado', status: 'aceito' },
        { email: 'pendente@npj.test', nome: 'Pendente', status: 'pendente' }
      ]
    });

    expect(destinatarios).toEqual([
      { email: 'pessoa@npj.test', nome: 'Pessoa' },
      { email: 'convidado@npj.test', nome: 'Convidado' }
    ]);
  });

  test('marca cada tipo somente depois de enviar aos participantes', async () => {
    const agendamento = {
      id: 10,
      usuario: { email: 'criador@npj.test', nome: 'Criador' },
      email_lembrete: 'criador@npj.test',
      convidados: [{ email: 'convidado@npj.test', status: 'aceito' }],
      save: jest.fn().mockResolvedValue(undefined)
    };
    Agendamento.findAll.mockResolvedValue([agendamento]);
    emailService.enviarLembreteAgendamento.mockResolvedValue({ success: true });

    await lembreteJob.processarAgendamentos({}, 'lembrete_dia_enviado', 'lembrete do dia');

    expect(emailService.enviarLembreteAgendamento).toHaveBeenCalledTimes(2);
    expect(agendamento.lembrete_dia_enviado).toBe(true);
    expect(agendamento.save).toHaveBeenCalledTimes(1);
    expect(Agendamento.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'marcado', lembrete_dia_enviado: false })
    }));
  });

  test('não marca o lembrete quando o envio falha', async () => {
    const agendamento = {
      id: 11,
      usuario: { email: 'criador@npj.test', nome: 'Criador' },
      convidados: [],
      save: jest.fn()
    };
    Agendamento.findAll.mockResolvedValue([agendamento]);
    emailService.enviarLembreteAgendamento.mockRejectedValue(new Error('SMTP indisponível'));

    await lembreteJob.processarAgendamentos({}, 'lembrete_1h_enviado', 'lembrete de 1 hora');

    expect(agendamento.lembrete_1h_enviado).toBeUndefined();
    expect(agendamento.save).not.toHaveBeenCalled();
  });

  test('lembrete do dia só é consultado durante a hora das 8', async () => {
    await lembreteJob.enviarLembretesDoDia(new Date(2026, 8, 14, 7, 45));
    expect(Agendamento.findAll).not.toHaveBeenCalled();
  });
});
