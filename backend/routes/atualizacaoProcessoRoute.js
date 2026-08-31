const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/authMiddleware');
const atualizacaoController = require('../controllers/atualizacaoProcessoController');
const { professorOrAdmin } = require('../middleware/roleMiddleware');
const { canAccessProcess } = require('../middleware/processAccessMiddleware');
const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Dados inválidos', errors: errors.array() });
  }
  next();
};

router.use(verificarToken);

router.get('/', [
  query('processo_id').optional().isInt({ min: 1 }).withMessage('ID do processo inválido')
], handleValidation, atualizacaoController.listarAtualizacoes);

router.post('/', [
  body('processo_id').isInt({ min: 1 }).withMessage('Processo é obrigatório'),
  body('tipo_atualizacao').trim().isLength({ min: 2, max: 100 }).withMessage('Tipo deve ter entre 2 e 100 caracteres'),
  body('descricao').trim().isLength({ min: 1, max: 5000 }).withMessage('Descrição é obrigatória e deve ter no máximo 5000 caracteres'),
  body('arquivo_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Arquivo inválido')
], handleValidation, canAccessProcess, atualizacaoController.criarAtualizacao);

router.get('/:id', [
  param('id').isInt({ min: 1 }).withMessage('ID inválido')
], handleValidation, atualizacaoController.obterAtualizacao);

router.put('/:id', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('tipo_atualizacao').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Tipo deve ter entre 2 e 100 caracteres'),
  body('descricao').optional().trim().isLength({ min: 1, max: 5000 }).withMessage('Descrição deve ter no máximo 5000 caracteres'),
  body('arquivo_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Arquivo inválido')
], handleValidation, atualizacaoController.atualizarAtualizacao);

router.delete('/:id', professorOrAdmin, [
  param('id').isInt({ min: 1 }).withMessage('ID inválido')
], handleValidation, atualizacaoController.deletarAtualizacao);

module.exports = router;
