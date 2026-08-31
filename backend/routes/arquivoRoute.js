const express = require('express');
const router = express.Router();

const verificarToken = require('../middleware/authMiddleware');
const arquivoController = require('../controllers/arquivoController');
const uploadMiddleware = require('../middleware/uploadMiddleware');

router.use(verificarToken);


router.get('/', arquivoController.listarArquivos);
router.get('/usuario/:id', arquivoController.listarArquivosPorUsuario);
router.post('/upload', uploadMiddleware.single('arquivo'), arquivoController.uploadArquivo);
router.get('/:id', arquivoController.obterArquivo);
router.get('/:id/download', arquivoController.downloadArquivo);
router.delete('/:id', arquivoController.deletarArquivo);

module.exports = router;
