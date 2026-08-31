const { EventEmitter } = require('events');
const requestLogging = require('../../../middleware/requestLoggingMiddleware');

function createResponse(statusCode = 200) {
  const response = new EventEmitter();
  response.statusCode = statusCode;
  response.headers = {};
  response.setHeader = (name, value) => { response.headers[name] = value; };
  return response;
}

describe('requestLoggingMiddleware', () => {
  const previousNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = previousNodeEnv;
    jest.restoreAllMocks();
  });

  test('propaga request id recebido e registra metadados sem corpo da requisição', () => {
    process.env.NODE_ENV = 'production';
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const req = {
      method: 'GET', path: '/api/processos', user: { id: 7 },
      get: (name) => name === 'x-request-id' ? 'request-cliente' : undefined
    };
    const res = createResponse(200);
    const next = jest.fn();

    requestLogging(req, res, next);
    res.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.requestId).toBe('request-cliente');
    expect(res.headers['x-request-id']).toBe('request-cliente');
    expect(info).toHaveBeenCalledWith('Requisição HTTP concluída', expect.objectContaining({
      requestId: 'request-cliente', method: 'GET', path: '/api/processos',
      statusCode: 200, userId: 7
    }));
    expect(info.mock.calls[0][1]).not.toHaveProperty('body');
  });

  test('gera request id e usa nível adequado para respostas de erro', () => {
    process.env.NODE_ENV = 'production';
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    const req = { method: 'POST', path: '/api/teste', get: () => undefined };

    const forbidden = createResponse(403);
    requestLogging(req, forbidden, jest.fn());
    forbidden.emit('finish');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(req.requestId).toEqual(expect.any(String));

    const failed = createResponse(500);
    requestLogging({ method: 'GET', path: '/falha', get: () => undefined }, failed, jest.fn());
    failed.emit('finish');
    expect(error).toHaveBeenCalledTimes(1);
  });
});
