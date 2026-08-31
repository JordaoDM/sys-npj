const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getJwtSecret, getJwtRefreshSecret } = require('../config/secrets');
const { enviarEmail } = require('../services/emailService');

const isDbAvailable = () => global.dbAvailable || false;

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }
    
    let usuario = null;
    
    if (isDbAvailable()) {
      try {
        const { usuarioModel: Usuario, roleModel: Role } = require('../models/indexModel');
        usuario = await Usuario.findOne({
          where: { email, ativo: true },
          include: [{ model: Role, as: 'role' }]
        });
        
        if (usuario && usuario.role) {
          const roleNome = usuario.role.nome;
          usuario.role = roleNome;
        }
      } catch (dbError) {
        global.dbAvailable = false;
      }
    }
    
    if (!usuario) {
      return res.status(404).json({ erro: 'Email não encontrado no sistema' });
    }
    
    let senhaValida = false;
    if (isDbAvailable() && usuario.senha && usuario.senha.startsWith('$2b$')) {
      senhaValida = await bcrypt.compare(senha, usuario.senha);
    } else {
      return res.status(503).json({ erro: 'Banco de dados não disponível' });
    }
    
    if (!senhaValida) {
      return res.status(401).json({ erro: 'Senha incorreta' });
    }
    
    const token = jwt.sign(
      { 
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        role_id: usuario.role_id
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { 
        id: usuario.id,
        type: 'refresh',
        jti: crypto.randomUUID()
      },
      getJwtRefreshSecret(),
      { expiresIn: '7d' }
    );

    const { refreshTokenModel: RefreshToken } = require('../models/indexModel');
    await RefreshToken.create({
      token: refreshToken,
      user_id: usuario.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      refreshToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        role_id: usuario.role_id
      }
    });
    
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.registro = async (req, res) => {
  try {
    const { nome, email, senha, telefone } = req.body;
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ erro: 'Formato de email inválido' });
    }
    
    if (senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
    }
    
    if (isDbAvailable()) {
      const { usuarioModel: Usuario } = require('../models/indexModel');
      
      const usuarioExistente = await Usuario.findOne({ where: { email } });
      if (usuarioExistente) {
        return res.status(400).json({ erro: 'Este email já está cadastrado no sistema' });
      }
      
      const senhaHash = await bcrypt.hash(senha, 10);
      
      const novoUsuario = await Usuario.create({
        nome,
        email,
        senha: senhaHash,
        telefone,
        role_id: 3,
        ativo: true
      });
      
      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso como Aluno',
        usuario: {
          id: novoUsuario.id,
          nome: novoUsuario.nome,
          email: novoUsuario.email,
          role_id: novoUsuario.role_id,
          role: 'Aluno'
        }
      });
      
    } else {
      res.status(503).json({ erro: 'Banco de dados não disponível' });
    }
    
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.perfil = async (req, res) => {
  try {
    const userId = req.user.id;
    let usuario = null;
    
    if (isDbAvailable()) {
      const { usuarioModel: Usuario, roleModel: Role } = require('../models/indexModel');
      usuario = await Usuario.findByPk(userId, {
        include: [{ model: Role, as: 'role' }]
      });
      
      if (usuario && usuario.role) {
        usuario.role = usuario.role.nome;
      }
    } else {
      return res.status(503).json({ erro: 'Banco de dados não disponível' });
    }
    
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    if (!usuario.ativo) {
      return res.status(401).json({ erro: 'Usuário inativado. Entre em contato com o administrador.' });
    }
    
    res.json({
      success: true,
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      role: usuario.role,
      role_id: usuario.role_id,
      ativo: usuario.ativo,
      session: {
        validated_at: new Date().toISOString(),
        token_valid: true
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.esqueciSenha = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ erro: 'Email é obrigatório' });
    }
    
    if (!isDbAvailable()) {
      return res.status(503).json({ erro: 'Banco de dados não disponível' });
    }

    const { usuarioModel: Usuario } = require('../models/indexModel');
    const usuario = await Usuario.findOne({ where: { email, ativo: true } });

    if (usuario) {
      const passwordProof = crypto.createHash('sha256').update(usuario.senha).digest('hex');
      const resetToken = jwt.sign(
        { id: usuario.id, type: 'password-reset', passwordProof },
        getJwtSecret(),
        { expiresIn: '30m' }
      );
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/resetar-senha?token=${encodeURIComponent(resetToken)}`;
      const emailResult = await enviarEmail({
        to: [{ email: usuario.email, name: usuario.nome }],
        subject: 'Recuperação de senha - Sistema NPJ',
        html: `<p>Olá, ${usuario.nome}.</p><p>Use o link abaixo para redefinir sua senha. Ele expira em 30 minutos e deixa de funcionar após a alteração.</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>Se você não solicitou esta alteração, ignore esta mensagem.</p>`
      });
      if (!emailResult?.success) {
        return res.status(503).json({ erro: 'Serviço de e-mail indisponível' });
      }
    }

    return res.json({
      success: true,
      message: 'Se o email existir, você receberá instruções de recuperação'
    });
    
  } catch (error) {
    return res.status(503).json({ erro: 'Serviço de e-mail indisponível' });
  }
};

exports.resetarSenha = async (req, res) => {
  try {
    const { token, nova_senha } = req.body;
    if (!token || !nova_senha) {
      return res.status(400).json({ erro: 'Token e nova senha são obrigatórios' });
    }
    if (nova_senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch {
      return res.status(401).json({ erro: 'Token de recuperação inválido ou expirado' });
    }
    if (decoded.type !== 'password-reset' || !decoded.passwordProof) {
      return res.status(401).json({ erro: 'Token de recuperação inválido' });
    }

    const { usuarioModel: Usuario, refreshTokenModel: RefreshToken } = require('../models/indexModel');
    const usuario = await Usuario.findOne({ where: { id: decoded.id, ativo: true } });
    if (!usuario) return res.status(401).json({ erro: 'Token de recuperação inválido' });

    const currentProof = crypto.createHash('sha256').update(usuario.senha).digest('hex');
    if (currentProof !== decoded.passwordProof) {
      return res.status(401).json({ erro: 'Token de recuperação já utilizado' });
    }

    usuario.senha = await bcrypt.hash(nova_senha, 10);
    await usuario.save();
    await RefreshToken.update({ revoked: true }, { where: { user_id: usuario.id, revoked: false } });
    return res.json({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    const { refreshTokenModel: RefreshToken } = require('../models/indexModel');
    const where = { user_id: req.user.id, revoked: false };
    if (refreshToken) where.token = refreshToken;
    const [revogados] = await RefreshToken.update({ revoked: true }, { where });
    return res.json({ success: true, message: 'Logout realizado com sucesso', tokens_revogados: revogados });
  } catch (error) {
    console.error('Erro no logout:', error);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ erro: 'Refresh token é obrigatório' });
    }
    
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, getJwtRefreshSecret());
    } catch (jwtError) {
      return res.status(401).json({ erro: 'Refresh token inválido ou expirado' });
    }
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ erro: 'Token inválido' });
    }
    
    if (isDbAvailable()) {
      try {
        const { refreshTokenModel: RefreshToken } = require('../models/indexModel');
        const storedToken = await RefreshToken.findOne({
          where: { 
            token: refreshToken,
            user_id: decoded.id,
            revoked: false
          }
        });
        
        if (!storedToken || new Date() > storedToken.expires_at) {
          return res.status(401).json({ erro: 'Refresh token expirado ou inválido' });
        }
      } catch (error) {
        console.error('️ Erro ao verificar refresh token no banco:', error.message);
        return res.status(503).json({ erro: 'Serviço de autenticação temporariamente indisponível' });
      }
    }
    
    let usuario = null;
    if (isDbAvailable()) {
      const { usuarioModel: Usuario, roleModel: Role } = require('../models/indexModel');
      usuario = await Usuario.findOne({
        where: { id: decoded.id, ativo: true },
        include: [{ model: Role, as: 'role' }]
      });
      
      if (usuario && usuario.role) {
        usuario.role = usuario.role.nome;
      }
    }
    
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário não encontrado ou inativo' });
    }
    
    const newToken = jwt.sign(
      { 
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
        role_id: usuario.role_id
      },
      getJwtSecret(),
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      token: newToken
    });
    
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
