const express = require('express');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');
const configuracaoLembreteController = require('../controllers/configuracaoLembreteController');

const router = express.Router();
const CAMPOS_PERMITIDOS = [
  'lembrete_24h_ativo',
  'lembrete_dia_ativo',
  'horario_lembrete_dia',
  'lembrete_antecipado_ativo',
  'antecedencia_minutos',
  'fuso_horario'
];

const validarAtualizacao = [
  body().custom((payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('O corpo da requisição deve ser um objeto');
    }
    const campos = Object.keys(payload);
    if (campos.length === 0) throw new Error('Informe ao menos uma configuração');
    const desconhecidos = campos.filter((campo) => !CAMPOS_PERMITIDOS.includes(campo));
    if (desconhecidos.length > 0) {
      throw new Error(`Campos não permitidos: ${desconhecidos.join(', ')}`);
    }
    return true;
  }),
  body('lembrete_24h_ativo').optional().isBoolean({ strict: true })
    .withMessage('lembrete_24h_ativo deve ser booleano').toBoolean(),
  body('lembrete_dia_ativo').optional().isBoolean({ strict: true })
    .withMessage('lembrete_dia_ativo deve ser booleano').toBoolean(),
  body('horario_lembrete_dia').optional().matches(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/)
    .withMessage('horario_lembrete_dia deve estar no formato HH:mm'),
  body('lembrete_antecipado_ativo').optional().isBoolean({ strict: true })
    .withMessage('lembrete_antecipado_ativo deve ser booleano').toBoolean(),
  body('antecedencia_minutos').optional().isInt({ min: 1, max: 10080 })
    .withMessage('antecedencia_minutos deve estar entre 1 e 10080').toInt(),
  body('fuso_horario').optional().isString().isLength({ min: 1, max: 64 })
    .withMessage('fuso_horario deve ter entre 1 e 64 caracteres')
    .custom((value) => {
      try {
        new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format();
        return true;
      } catch (_error) {
        throw new Error('fuso_horario inválido');
      }
    }),
  body().custom(async (payload) => {
    const ConfiguracaoLembrete = require('../models/configuracaoLembreteModel');
    const atual = await ConfiguracaoLembrete.findByPk(1);
    const lembrete24hAtivo = payload.lembrete_24h_ativo ?? atual?.lembrete_24h_ativo ?? true;
    const antecipadoAtivo = payload.lembrete_antecipado_ativo ?? atual?.lembrete_antecipado_ativo ?? true;
    const antecedencia = payload.antecedencia_minutos ?? atual?.antecedencia_minutos ?? 60;
    if (lembrete24hAtivo && antecipadoAtivo && Number(antecedencia) === 1440) {
      throw new Error('O lembrete antecipado não pode repetir o lembrete de 24 horas');
    }
    return true;
  })
];

function responderErros(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Configuração de lembretes inválida',
      errors: errors.array().map(({ path, msg, value }) => ({ campo: path || 'configuracao', mensagem: msg, valor: value }))
    });
  }
  return next();
}

router.use(authMiddleware, adminOnly);
router.get('/lembretes', configuracaoLembreteController.obter);
router.put('/lembretes', validarAtualizacao, responderErros, configuracaoLembreteController.atualizar);
router.post('/lembretes/restaurar', configuracaoLembreteController.restaurarPadrao);

module.exports = router;
