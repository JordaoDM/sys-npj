const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/authMiddleware');
const processoController = require('../controllers/processoController');
const { preveniDuplicacaoProcesso, preveniDuplicacaoVinculacao } = require('../middleware/antiDuplicacaoMiddleware');
const { validate, handleValidation } = require('../middleware/validationMiddleware');
const { professorOrAdmin } = require('../middleware/roleMiddleware');
const { canAccessProcess } = require('../middleware/processAccessMiddleware');

router.use(verificarToken);

router.get('/', validate('buscarProcessos'), handleValidation, processoController.listarProcessos);
router.post('/', professorOrAdmin, validate('criarProcesso'), handleValidation, preveniDuplicacaoProcesso, processoController.criarProcesso);
router.get('/usuario', processoController.listarProcessosUsuario);
router.get('/:id/detalhes', validate('getProcesso'), handleValidation, canAccessProcess, processoController.obterProcessoDetalhes);
router.get('/:id/usuarios', validate('getProcesso'), handleValidation, canAccessProcess, processoController.listarUsuariosProcesso);
router.post('/:id/vincular-usuario', professorOrAdmin, validate('atribuirUsuario'), handleValidation, preveniDuplicacaoVinculacao, processoController.vincularUsuario);
router.delete('/:id/desvincular-usuario', professorOrAdmin, validate('getProcesso'), handleValidation, processoController.desvincularUsuario);
router.put('/:id/concluir', professorOrAdmin, validate('getProcesso'), handleValidation, processoController.concluirProcesso);
router.put('/:id/reabrir', professorOrAdmin, validate('getProcesso'), handleValidation, processoController.reabrirProcesso);
router.get('/:id', validate('getProcesso'), handleValidation, canAccessProcess, processoController.obterProcesso);
router.put('/:id', professorOrAdmin, validate('atualizarProcesso'), handleValidation, preveniDuplicacaoProcesso, processoController.atualizarProcesso);
router.delete('/:id', professorOrAdmin, validate('getProcesso'), handleValidation, processoController.deletarProcesso);

module.exports = router;
