const { sanitize } = require('../../../utils/productionLogger');

describe('productionLogger', () => {
  test('mascara segredos, tokens e dados pessoais em estruturas aninhadas', () => {
    const source = {
      email: 'administrador@npj.local',
      senha: 'segredo',
      authorization: 'Bearer token-aberto',
      nested: { refreshToken: 'refresh-aberto' },
      values: ['aluno@teste.local']
    };

    expect(sanitize(source)).toEqual({
      email: 'adm***@npj.local',
      senha: '[REDACTED]',
      authorization: '[REDACTED]',
      nested: { refreshToken: '[REDACTED]' },
      values: ['alu***@teste.local']
    });
  });

  test('serializa erros e estruturas circulares sem lançar exceção', () => {
    const source = { error: new Error('Falha para usuario@teste.local') };
    source.self = source;
    const sanitized = sanitize(source);

    expect(sanitized.error).toMatchObject({ name: 'Error', message: 'Falha para usu***@teste.local' });
    expect(sanitized.self).toBe('[Circular]');
  });

  test('em produção respeita nível e emite uma linha JSON sanitizada', () => {
    const originalEnv = { nodeEnv: process.env.NODE_ENV, logLevel: process.env.LOG_LEVEL };
    const originalConsole = {
      log: console.log, info: console.info, warn: console.warn,
      error: console.error, debug: console.debug
    };
    const outputs = {
      log: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn()
    };

    try {
      Object.assign(console, outputs);
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = 'warn';
      jest.resetModules();
      require('../../../utils/productionLogger').configureProductionLogging();

      console.info('evento ignorado');
      console.error('Falha de usuario@teste.local', { token: 'aberto' });

      expect(outputs.info).not.toHaveBeenCalled();
      expect(outputs.error).toHaveBeenCalledTimes(1);
      expect(JSON.parse(outputs.error.mock.calls[0][0])).toMatchObject({
        level: 'error',
        message: 'Falha de usu***@teste.local',
        context: { token: '[REDACTED]' }
      });
    } finally {
      Object.assign(console, originalConsole);
      process.env.NODE_ENV = originalEnv.nodeEnv;
      process.env.LOG_LEVEL = originalEnv.logLevel;
    }
  });
});
