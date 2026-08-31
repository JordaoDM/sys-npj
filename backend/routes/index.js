const { body, param, query, validationResult } = require('express-validator');
const agendamentoController = require('../controllers/agendamentoController');

const routeRegistry = [
  ['auth', require('./autorizacaoRoute')],
  ['usuarios', require('./usuarioRoute')],
  ['processos', require('./processoRoute')],
  ['agendamentos', require('./agendamentos')],
  ['tabelas-auxiliares', require('./tabelasAuxiliares')],
  ['atualizacoes', require('./atualizacaoProcessoRoute')],
  ['arquivos', require('./arquivoRoute')],
  ['dashboard', require('./dashboardRoute')]
];

function mountApplicationRoutes(app) {
  routeRegistry.forEach(([path, router]) => app.use(`/api/${path}`, router));

  app.get('/api/convite/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
    query('email').optional().isEmail().withMessage('Email deve ter formato válido')
  ], validatePublicInvitation, agendamentoController.visualizarConvitePublico);

  app.post('/api/convite/:id/aceitar', [
    param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
    body('email').isEmail().withMessage('Email deve ter formato válido')
  ], validatePublicInvitation, agendamentoController.aceitarConvitePublico);

  app.post('/api/convite/:id/recusar', [
    param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
    body('email').isEmail().withMessage('Email deve ter formato válido'),
    body('justificativa').trim().isLength({ min: 3, max: 1000 }).withMessage('Justificativa deve ter entre 3 e 1000 caracteres')
  ], validatePublicInvitation, agendamentoController.recusarConvitePublico);

}

function validatePublicInvitation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
  }
  next();
}

module.exports = { mountApplicationRoutes, routeRegistry };
