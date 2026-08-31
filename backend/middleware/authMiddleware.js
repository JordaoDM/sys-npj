const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/secrets');

function isDbAvailable() {
  return global.dbAvailable || false;
}

const authMiddleware = async (req, res, next) => {
  try {
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ erro: 'Token de acesso requerido' });
    }
    
    const decoded = jwt.verify(token, getJwtSecret());
    
    if (!isDbAvailable()) {
      return res.status(503).json({ erro: 'Serviço de autenticação temporariamente indisponível' });
    }

    let usuario = null;
    try {
      const { usuarioModel: Usuario, roleModel: Role } = require('../models/indexModel');
      const usuarioDb = await Usuario.findByPk(decoded.id, {
        include: [{ model: Role, as: 'role' }]
      });

      if (usuarioDb && usuarioDb.role) {
        usuario = {
          id: usuarioDb.id,
          nome: usuarioDb.nome,
          email: usuarioDb.email,
          role: usuarioDb.role.nome,
          role_id: usuarioDb.role_id,
          ativo: usuarioDb.ativo
        };
      }
    } catch (dbError) {
      console.error('Erro ao validar usuário no banco:', dbError.message);
      return res.status(503).json({ erro: 'Serviço de autenticação temporariamente indisponível' });
    }
    
    if (!usuario || !usuario.ativo) {
      return res.status(401).json({ erro: 'Token inválido ou usuário inativo' });
    }
    
    req.user = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      role_id: usuario.role_id
    };
    
    next();
    
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ erro: 'Token expirado' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ erro: 'Token inválido' });
    }
    
    if (error.code === 'CONFIGURATION_ERROR') {
      console.error('Erro de configuração:', error.message);
      return res.status(503).json({ erro: 'Serviço de autenticação não configurado' });
    }

    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = authMiddleware;
