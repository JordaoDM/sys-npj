const express = require('express');
const router = express.Router();
const tabelasAuxiliaresController = require('../controllers/tabelasAuxiliaresController');
const authMiddleware = require('../middleware/authMiddleware');
const { body, param } = require('express-validator');
const { adminOnly } = require('../middleware/roleMiddleware');

router.use(authMiddleware);

const validacaoId = [
  param('id').isInt({ min: 1 }).withMessage('ID deve ser um número positivo')
];

const validacaoNome = [
  body('nome')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Descrição deve ter no máximo 500 caracteres')
];

router.get('/materias', tabelasAuxiliaresController.listarMaterias);

router.post('/materias', adminOnly, validacaoNome, tabelasAuxiliaresController.criarMateria);

router.delete('/materias/:id', adminOnly, validacaoId, tabelasAuxiliaresController.excluirMateria);

router.get('/fases', tabelasAuxiliaresController.listarFases);

router.post('/fases', adminOnly, validacaoNome, tabelasAuxiliaresController.criarFase);

router.delete('/fases/:id', adminOnly, validacaoId, tabelasAuxiliaresController.excluirFase);

router.get('/diligencias', tabelasAuxiliaresController.listarDiligencias);

router.post('/diligencias', adminOnly, validacaoNome, tabelasAuxiliaresController.criarDiligencia);

router.delete('/diligencias/:id', adminOnly, validacaoId, tabelasAuxiliaresController.excluirDiligencia);

router.get('/locais-tramitacao', tabelasAuxiliaresController.listarLocaisTramitacao);

router.post('/locais-tramitacao', adminOnly, validacaoNome, tabelasAuxiliaresController.criarLocalTramitacao);

router.delete('/locais-tramitacao/:id', adminOnly, validacaoId, tabelasAuxiliaresController.excluirLocalTramitacao);

module.exports = router;
