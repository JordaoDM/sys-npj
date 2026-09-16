jest.mock('node-cron', () => ({ schedule: jest.fn() }));
jest.mock('../../../models/agendamentoModel', () => ({ findAll: jest.fn() }));
jest.mock('../../../models/usuarioModel', () => ({}));
jest.mock('../../../models/processoModel', () => ({}));
jest.mock('../../../models/configuracaoLembreteModel', () => ({
  findOrCreate: jest.fn(),
  padrao: {
    id: 1,
    lembrete_24h_ativo: true,
    lembrete_dia_ativo: true,
    horario_lembrete_dia: '08:00:00',
    lembrete_antecipado_ativo: true,
    antecedencia_minutos: 60,
    fuso_horario: 'America/Sao_Paulo'
  }
}));
jest.mock('../../../services/emailService', () => ({
  enviarLembreteAgendamento: jest.fn()
}));

const Agendamento = require('../../../models/agendamentoModel');
const emailService = require('../../../services/emailService');
const ConfiguracaoLembrete = require('../../../models/configuracaoLembreteModel');
const lembreteJob = require('../../../jobs/lembreteJob');

const configuracaoPadrao = ConfiguracaoLembrete.padrao;

describe('LembreteJob unificado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lembreteJob.isRunning = false;
    ConfiguracaoLembrete.findOrCreate.mockResolvedValue([{
      get: () => ({ ...configuracaoPadrao })
    }]);
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

  test('lembrete do dia aguarda o horário configurado no fuso definido', async () => {
    await lembreteJob.enviarLembretesDoDia(
      new Date('2026-09-14T10:45:00.000Z'),
      configuracaoPadrao
    );
    expect(Agendamento.findAll).not.toHaveBeenCalled();
  });

  test('lembrete do dia usa a data de Brasília após o horário configurado', async () => {
    Agendamento.findAll.mockResolvedValue([]);
    await lembreteJob.enviarLembretesDoDia(
      new Date('2026-09-14T11:05:00.000Z'),
      configuracaoPadrao
    );

    expect(Agendamento.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: 'marcado', lembrete_dia_enviado: false })
    }));
  });

  test('usa a antecedência configurada para calcular a janela de envio', async () => {
    Agendamento.findAll.mockResolvedValue([]);
    const agora = new Date('2026-09-14T12:00:00.000Z');
    await lembreteJob.enviarLembretesAntecipados(agora, 90);

    const consulta = Agendamento.findAll.mock.calls[0][0].where.data_inicio;
    const [, limite] = consulta[Object.getOwnPropertySymbols(consulta)[0]];
    expect(limite.toISOString()).toBe('2026-09-14T13:30:00.000Z');
  });

  test('respeita opções desativadas e consulta a configuração em cada ciclo', async () => {
    ConfiguracaoLembrete.findOrCreate.mockResolvedValue([{
      get: () => ({
        ...configuracaoPadrao,
        lembrete_24h_ativo: false,
        lembrete_dia_ativo: false,
        lembrete_antecipado_ativo: false
      })
    }]);
    Agendamento.findAll.mockResolvedValue([]);

    await lembreteJob.executar(new Date('2026-09-14T12:00:00.000Z'));
    await lembreteJob.executar(new Date('2026-09-14T12:15:00.000Z'));

    expect(ConfiguracaoLembrete.findOrCreate).toHaveBeenCalledTimes(2);
    expect(Agendamento.findAll).toHaveBeenCalledTimes(2);
    expect(Agendamento.findAll.mock.calls.every(([opcoes]) => opcoes.where.status === 'enviando_convites')).toBe(true);
  });
});
