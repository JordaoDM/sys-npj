const express = require('express');
const router = express.Router();
const autorizacaoController = require('../controllers/autorizacaoController');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas tentativas. Tente novamente mais tarde.' }
});

router.post('/login', authenticationLimiter, autorizacaoController.login);

router.post('/registro', autorizacaoController.registro);

router.get('/perfil', authMiddleware, autorizacaoController.perfil);

router.post('/esqueci-senha', authenticationLimiter, autorizacaoController.esqueciSenha);
router.post('/resetar-senha', authenticationLimiter, autorizacaoController.resetarSenha);

router.post('/logout', authMiddleware, autorizacaoController.logout);

router.post('/refresh', authenticationLimiter, autorizacaoController.refresh);

router.get('/verificar-token', authMiddleware, (req, res) => {
  try {
    res.json({ 
      valido: true, 
      usuario: {
        id: req.user.id,
        nome: req.user.nome,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
});

module.exports = router;
