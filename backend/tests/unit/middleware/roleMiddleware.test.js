const { roleMiddleware, adminOnly, professorOrAdmin } = require('../../../middleware/roleMiddleware');

function execute(middleware, user) {
  const req = { user };
  const res = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  const next = jest.fn();
  middleware(req, res, next);
  return { res, next };
}

describe('roleMiddleware', () => {
  test('rejeita requisição sem usuário', () => {
    const { res, next } = execute(adminOnly, undefined);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite Admin por nome independentemente de caixa', () => {
    const { next } = execute(adminOnly, { role: 'admin' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('permite Professor nas rotas de professor ou admin', () => {
    const { next } = execute(professorOrAdmin, { role: 'Professor' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('nega Aluno em rota administrativa', () => {
    const { res, next } = execute(professorOrAdmin, { role: 'Aluno' });
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([{ nome: 'Professor' }, 1, null])('rejeita role fora do contrato canônico: %p', (role) => {
    const middleware = roleMiddleware(['Admin', 'Professor']);
    const { res, next } = execute(middleware, { role });
    expect(res.statusCode).toBe(500);
    expect(next).not.toHaveBeenCalled();
  });
});
