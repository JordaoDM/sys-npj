
const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const { preveniDuplicacaoAgendamento } = require('../middleware/antiDuplicacaoMiddleware');
const { body, param, query, validationResult } = require('express-validator');
const { professorOrAdmin } = require('../middleware/roleMiddleware');

const agendamentoController = require('../controllers/agendamentoController');
const agendamentoStatsController = require('../controllers/agendamentoStatsController');

const handleRouteValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};


router.post('/:id/aceitar-publico', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('email').isEmail().withMessage('Email deve ter formato válido')
], handleRouteValidation, agendamentoController.aceitarConvitePublico);

router.post('/:id/recusar-publico', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('email').isEmail().withMessage('Email deve ter formato válido'),
  body('justificativa').trim().isLength({ min: 3, max: 1000 }).withMessage('Justificativa deve ter entre 3 e 1000 caracteres')
], handleRouteValidation, agendamentoController.recusarConvitePublico);

router.use(authMiddleware);


router.get('/filtros', agendamentoController.obterFiltros);

router.get('/stats', agendamentoStatsController.getStats);

router.get('/stats/convites', agendamentoStatsController.getConviteStats);

router.get('/lembrete/pendentes', professorOrAdmin, agendamentoController.buscarParaLembrete);


router.post('/', [
  body('titulo')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Título deve ter entre 3 e 255 caracteres'),
  
  body('data_inicio')
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida'),
  
  body('data_fim')
    .isISO8601()
    .withMessage('Data de fim deve ser uma data válida'),
  
  body('tipo')
    .optional()
    .isIn(['reuniao', 'audiencia', 'prazo', 'outro'])
    .withMessage('Tipo deve ser: reuniao, audiencia, prazo ou outro'),
  
  body('email_lembrete')
    .optional()
    .isEmail()
    .withMessage('Email deve ter formato válido'),
  
  body('convidados')
    .optional()
    .isArray()
    .withMessage('Convidados deve ser um array'),
  
  body('convidados.*.email')
    .optional()
    .isEmail()
    .withMessage('Email do convidado deve ter formato válido'),
  
  body('local')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Local deve ter no máximo 500 caracteres'),
    
  preveniDuplicacaoAgendamento
], agendamentoController.criar);

router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('processo_id').optional().isInt({ min: 1 }).withMessage('ID do processo deve ser um número positivo'),
  query('status').optional().isIn(['todos', 'em_analise', 'pendente', 'enviando_convites', 'marcado', 'cancelado', 'finalizado']).withMessage('Status inválido'),
  query('tipo').optional().isIn(['reuniao', 'audiencia', 'prazo', 'outro']).withMessage('Tipo inválido'),
  query('data_inicio').optional().isISO8601().withMessage('Data de início inválida'),
  query('data_fim').optional().isISO8601().withMessage('Data de fim inválida'),
  query('meus_agendamentos').optional().isBoolean().withMessage('Meus agendamentos deve ser true/false')
], agendamentoController.listar);

router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo')
], agendamentoController.buscarPorId);

router.put('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  
  body('titulo')
    .optional()
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Título deve ter entre 3 e 255 caracteres'),
  
  body('data_inicio')
    .optional()
    .isISO8601()
    .withMessage('Data de início deve ser uma data válida'),
  
  body('data_fim')
    .optional()
    .isISO8601()
    .withMessage('Data de fim deve ser uma data válida'),
  
  body('tipo')
    .optional()
    .isIn(['reuniao', 'audiencia', 'prazo', 'outro'])
    .withMessage('Tipo deve ser: reuniao, audiencia, prazo ou outro'),
  
  body('status')
    .optional()
    .isIn(['em_analise', 'pendente', 'enviando_convites', 'marcado', 'cancelado', 'finalizado'])
    .withMessage('Status inválido'),
  
  body('email_lembrete')
    .optional()
    .isEmail()
    .withMessage('Email deve ter formato válido'),
  
  body('convidados')
    .optional()
    .isArray()
    .withMessage('Convidados deve ser um array'),
  
  body('convidados.*.email')
    .optional()
    .isEmail()
    .withMessage('Email do convidado deve ter formato válido'),
  
  body('local')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Local deve ter no máximo 500 caracteres')
], agendamentoController.atualizar);

router.delete('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo')
], agendamentoController.deletar);


router.patch('/:id/status', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('status')
    .isIn(['em_analise', 'pendente', 'enviando_convites', 'marcado', 'cancelado', 'finalizado'])
    .withMessage('Status inválido')
], agendamentoController.marcarStatus);


router.post('/:id/aceitar', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('email').optional().isEmail().withMessage('Email deve ter formato válido')
], agendamentoController.aceitarConvite);

router.post('/:id/recusar', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('email').optional().isEmail().withMessage('Email deve ter formato válido')
], agendamentoController.recusarConvite);


router.get('/processo/:processoId', [
  param('processoId').isInt({ min: 1 }).withMessage('ID do processo deve ser um número positivo')
], agendamentoController.listarPorProcesso);

router.post('/:id/lembrete', [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo')
], agendamentoController.enviarLembrete);


router.post('/:id/aprovar', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('observacoes').optional().isLength({ max: 1000 }).withMessage('Observações devem ter no máximo 1000 caracteres')
], agendamentoController.aprovar);

router.post('/:id/recusar-solicitacao', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('motivo_recusa').notEmpty().withMessage('Motivo da recusa é obrigatório')
    .isLength({ min: 10, max: 1000 }).withMessage('Motivo deve ter entre 10 e 1000 caracteres')
], agendamentoController.recusar);

router.post('/:id/cancelar', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('motivo').optional().isLength({ max: 1000 }).withMessage('Motivo deve ter no máximo 1000 caracteres')
], agendamentoController.cancelarAgendamento);

router.post('/verificar-status', professorOrAdmin, agendamentoController.verificarStatusAgendamentos);

router.post('/:id/confirmar-misto', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo'),
  body('decisao').isIn(['confirmar', 'cancelar']).withMessage('Decisão deve ser "confirmar" ou "cancelar"'),
  body('observacoes').optional().isLength({ min: 3 }).withMessage('Observações devem ter pelo menos 3 caracteres')
], agendamentoController.confirmarAgendamentoMisto);

module.exports = router;
