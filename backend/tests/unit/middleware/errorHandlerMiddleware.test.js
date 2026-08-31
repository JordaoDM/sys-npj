const errorHandler = require('../../../middleware/errorHandlerMiddleware');

function execute(error, nodeEnv = 'test') {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = nodeEnv;
  const req = {
    url: '/api/teste', method: 'POST', ip: '127.0.0.1', requestId: 'req-123'
  };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  errorHandler(error, req, res, jest.fn());
  log.mockRestore();
  process.env.NODE_ENV = previous;
  return res;
}

describe('errorHandlerMiddleware', () => {
  test.each([
    ['SequelizeValidationError', 400, 'Erro de validação de dados'],
    ['SequelizeUniqueConstraintError', 409, 'Violação de restrição única - dados duplicados'],
    ['SequelizeForeignKeyConstraintError', 400, 'Erro de referência - dados relacionados não encontrados'],
    ['MulterError', 400, 'Arquivo excedeu o limite']
  ])('normaliza %s', (name, status, message) => {
    const error = Object.assign(new Error(name === 'MulterError' ? message : 'detalhe interno'), { name });
    const response = execute(error);
    expect(response.statusCode).toBe(status);
    expect(response.body).toMatchObject({ erro: message, requestId: 'req-123' });
  });

  test('preserva status explícito e só expõe diagnóstico em desenvolvimento', () => {
    const error = Object.assign(new Error('Conflito conhecido'), { status: 418 });
    const production = execute(error, 'production');
    expect(production.statusCode).toBe(418);
    expect(production.body).not.toHaveProperty('stack');

    const development = execute(error, 'development');
    expect(development.body).toHaveProperty('stack');
    expect(development.body).toHaveProperty('details');
  });
});
