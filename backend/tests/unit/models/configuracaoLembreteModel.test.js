const ConfiguracaoLembrete = require('../../../models/configuracaoLembreteModel');

describe('ConfiguracaoLembrete', () => {
  test('expõe os valores padrão atuais do sistema', () => {
    expect(ConfiguracaoLembrete.padrao).toEqual({
      id: 1,
      lembrete_24h_ativo: true,
      lembrete_dia_ativo: true,
      horario_lembrete_dia: '08:00:00',
      lembrete_antecipado_ativo: true,
      antecedencia_minutos: 60,
      fuso_horario: 'America/Sao_Paulo'
    });
  });

  test('aplica os padrões ao construir a configuração singleton', () => {
    const configuracao = ConfiguracaoLembrete.build();

    expect(configuracao.id).toBe(1);
    expect(configuracao.lembrete_24h_ativo).toBe(true);
    expect(configuracao.lembrete_dia_ativo).toBe(true);
    expect(configuracao.horario_lembrete_dia).toBe('08:00:00');
    expect(configuracao.lembrete_antecipado_ativo).toBe(true);
    expect(configuracao.antecedencia_minutos).toBe(60);
    expect(configuracao.fuso_horario).toBe('America/Sao_Paulo');
  });

  test('rejeita outro ID, antecedência fora do limite e fuso inválido', async () => {
    const configuracao = ConfiguracaoLembrete.build({
      id: 2,
      antecedencia_minutos: 0,
      fuso_horario: 'Fuso/Inexistente'
    });

    await expect(configuracao.validate()).rejects.toMatchObject({
      name: 'SequelizeValidationError'
    });
  });
});
