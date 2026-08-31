const { check, validationResult } = require('express-validator');

const validate = (method) => {
  switch(method) {
    case 'registrarUsuario':
      return [
        check('nome').notEmpty().withMessage('Nome é obrigatório')
          .isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres')
          .trim(),
        check('email').isEmail().withMessage('Email inválido')
          .normalizeEmail(),
        check('senha').isLength({ min: 6 }).withMessage('Senha deve ter pelo menos 6 caracteres'),
        check('role_id').isInt({ min: 1 }).withMessage('ID de perfil inválido')
      ];
      
    case 'loginUsuario':
      return [
        check('email').isEmail().withMessage('Email inválido')
          .normalizeEmail()
          .isLength({ max: 254 }).withMessage('Email muito longo'),
        check('senha').notEmpty().withMessage('Senha é obrigatória')
          .isLength({ min: 1, max: 128 }).withMessage('Senha com tamanho inválido')
      ];
      
    case 'refreshToken':
      return [
        check('refreshToken').notEmpty().withMessage('Refresh token é obrigatório')
          .isString().withMessage('Refresh token deve ser string')
          .isLength({ min: 32, max: 512 }).withMessage('Refresh token com formato inválido')
      ];

    case 'getUsuario':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de usuário inválido')
          .toInt()
      ];
      
    case 'updateUsuario':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de usuário inválido')
          .toInt(),
        check('nome').optional().isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres')
          .trim(),
        check('email').optional().isEmail().withMessage('Email inválido')
          .normalizeEmail(),
        check('role_id').optional().isInt({ min: 1 }).withMessage('ID de perfil inválido')
      ];

    case 'updateMe':
      return [
        check('nome').optional().isLength({ min: 3 }).withMessage('Nome deve ter pelo menos 3 caracteres')
          .trim(),
        check('email').optional().isEmail().withMessage('Email inválido')
          .normalizeEmail(),
        check('telefone').optional().isString().withMessage('Telefone deve ser texto')
          .trim()
      ];
      
    case 'updateSenha':
      return [
        check('senha_atual').notEmpty().withMessage('Senha atual é obrigatória'),
        check('nova_senha').isLength({ min: 6 }).withMessage('Nova senha deve ter pelo menos 6 caracteres')
      ];

    case 'criarProcesso':
      return [
        check('numero_processo').notEmpty().withMessage('Número do processo é obrigatório')
          .isString().withMessage('Número do processo deve ser texto')
          .matches(/^[\d.\-/]+$/).withMessage('Número do processo deve conter apenas números, pontos, hífens ou barras')
          .custom((value) => {
            const digits = String(value || '').replace(/\D/g, '');
            if (digits.length < 5) {
              throw new Error('Número do processo deve ter pelo menos 5 dígitos');
            }
            return true;
          })
          .trim(),
        check('titulo').notEmpty().withMessage('Título do processo é obrigatório')
          .isString().withMessage('Título do processo deve ser texto')
          .trim(),
        check('contato_assistido').notEmpty().withMessage('Contato do assistido é obrigatório')
          .isString().withMessage('Contato do assistido deve ser texto')
          .trim(),
      ];
    
    case 'buscarProcessos':
    return [
        check('pagina').optional().isInt({ min: 1 }).toInt(),
        check('porPagina').optional().isInt({ min: 1, max: 100 }).toInt(),
        check('numero_processo').optional().trim(),
        check('aluno_id').optional().isInt().toInt()
    ];
    
    case 'listarAlunosPorProcesso':
      return [
          check('processo_id').isInt({ min: 1 }).withMessage('ID do processo inválido')
      ];
    
    case 'atribuirAluno':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido'),
        check('aluno_id').isInt({ min: 1 }).withMessage('ID de aluno inválido')
      ];
      
    case 'getProcesso':
      return [
        check('id').isInt({ min: 1 }).withMessage('ID de processo inválido')
          .toInt()
      ];

    case 'adicionarAtualizacao':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido')
          .toInt(),
        check('descricao').notEmpty().withMessage('Descrição é obrigatória')
          .isString().withMessage('Descrição deve ser texto')
          .trim()
      ];
      
    case 'listarAtualizacoes':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido')
          .toInt()
      ];

    case 'atualizarProcesso':
      return [
        check('numero_processo').optional().notEmpty().withMessage('Número do processo não pode estar vazio')
          .isString().withMessage('Número do processo deve ser texto')
          .matches(/^[\d.\-/]+$/).withMessage('Número do processo deve conter apenas números, pontos, hífens ou barras')
          .custom((value) => {
            const digits = String(value || '').replace(/\D/g, '');
            if (digits.length < 5) {
              throw new Error('Número do processo deve ter pelo menos 5 dígitos');
            }
            return true;
          })
          .trim(),
        check('contato_assistido').optional().notEmpty().withMessage('Contato do assistido não pode estar vazio')
          .isString().withMessage('Contato do assistido deve ser texto')
          .trim(),
        check('assistido').optional().trim(),
        check('descricao').optional().trim(),
        check('status').optional().trim(),
        check('sistema').optional().trim()
      ];

    case 'atribuirUsuario':
      return [
        check('processo_id').isInt({ min: 1 }).withMessage('ID de processo inválido'),
        check('usuario_id').isInt({ min: 1 }).withMessage('ID de usuário inválido'),
        check('role').isString().trim().notEmpty().withMessage('Role inválida')
      ];

    default:
      return [];
  }
};

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(' Falha na validação:', {
      ip: req.ip || req.connection.remoteAddress,
      method: req.method,
      path: req.path,
      user: req.user?.id || 'não autenticado',
      errors: errors.array().map(err => `${err.param}: ${err.msg}`)
    });
    
    const errorDetails = errors.array().map(err => {
      const field = err.path || err.param || 'campo';
      return {
        campo: field,
        mensagem: err.msg,
        valor: ['senha', 'password', 'token'].includes(field.toLowerCase())
          ? '[OCULTO]'
          : err.value
      };
    });
    
    return res.status(400).json({ 
      erro: 'Dados inválidos fornecidos',
      detalhes: errorDetails,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = { validate, handleValidation };
