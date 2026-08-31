const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/authMiddleware');
const { roleMiddleware, adminOnly } = require('../middleware/roleMiddleware');
const usuarioController = require('../controllers/usuarioController');
const { preveniDuplicacaoUsuario } = require('../middleware/antiDuplicacaoMiddleware');
const { validate, handleValidation } = require('../middleware/validationMiddleware');

router.use(verificarToken);

router.get('/me', usuarioController.me);
router.put('/me', validate('updateMe'), handleValidation, usuarioController.updateMe);
router.put('/me/senha', validate('updateSenha'), handleValidation, usuarioController.changePassword);
router.delete('/me', usuarioController.deleteMe);
router.get('/', roleMiddleware(['Admin', 'Professor']), usuarioController.listarUsuarios);
router.post('/', roleMiddleware(['Admin', 'Professor']), validate('registrarUsuario'), handleValidation, preveniDuplicacaoUsuario, usuarioController.criarUsuario);
router.get('/alunos', roleMiddleware(['Admin', 'Professor']), usuarioController.listarAlunos);
router.get('/para-vinculacao', roleMiddleware(['Admin', 'Professor']), usuarioController.buscarUsuariosParaVinculacao);

router.put('/:id/senha', adminOnly, usuarioController.atualizarSenha);

router.get('/:id', roleMiddleware(['Admin', 'Professor']), validate('getUsuario'), handleValidation, usuarioController.obterUsuario);
router.put('/:id', roleMiddleware(['Admin', 'Professor']), validate('updateUsuario'), handleValidation, preveniDuplicacaoUsuario, usuarioController.atualizarUsuario);
router.put('/:id/reativar', roleMiddleware(['Admin']), validate('getUsuario'), handleValidation, usuarioController.reativarUsuario);
router.delete('/:id', roleMiddleware(['Admin', 'Professor']), validate('getUsuario'), handleValidation, usuarioController.deletarUsuario);

module.exports = router;
