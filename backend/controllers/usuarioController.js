exports.atualizarSenha = async (req, res) => {
  try {
    const { id } = req.params;
    const { senha } = req.body;
    if (!senha || senha.length < 6) {
      return res.status(400).json({ erro: 'Senha deve ter pelo menos 6 caracteres' });
    }
    const bcrypt = require('bcrypt');
    const { usuarioModel: Usuario } = require('../models/indexModel');
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    usuario.senha = await bcrypt.hash(senha, 10);
    await usuario.save();
    res.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao atualizar senha' });
  }
};
exports.listarAlunos = async (req, res) => {
  try {
    const alunos = await Usuario.findAll({
      where: { ativo: true, role_id: 3 },
      attributes: ['id', 'nome', 'email', 'role_id', 'ativo', 'criado_em', 'telefone'],
      order: [['nome', 'ASC']]
    });
    res.json(alunos.map(serializeUsuario));
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
const bcrypt = require('bcrypt');
const { usuarioModel: Usuario, roleModel: Role } = require('../models/indexModel');
const ROLE_NAMES = { 1: 'Admin', 2: 'Professor', 3: 'Aluno' };

function serializeUsuario(usuario) {
  const data = typeof usuario.toJSON === 'function' ? usuario.toJSON() : { ...usuario };
  delete data.senha;
  data.role = typeof data.role === 'object' ? data.role.nome : ROLE_NAMES[data.role_id];
  return data;
}

exports.me = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: ['id', 'nome', 'email', 'role_id', 'ativo', 'criado_em', 'telefone']
    });
    
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.json(serializeUsuario(usuario));
    
  } catch (error) {
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    
    const { nome, email, telefone } = req.body;
    
    if (email) {
      const usuarioExistente = await Usuario.findOne({ 
        where: { 
          email,
          id: { [require('sequelize').Op.ne]: req.user.id }
        } 
      });
      if (usuarioExistente) {
        return res.status(400).json({ erro: 'Email já está em uso' });
      }
    }
    
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    await usuario.update({ nome, email, telefone });
    
    const usuarioAtualizado = await Usuario.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }],
      attributes: ['id', 'nome', 'email', 'role_id', 'ativo', 'criado_em', 'telefone']
    });
    
    res.json(serializeUsuario(usuarioAtualizado));
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    
    const { senha_atual, nova_senha } = req.body;
    
    if (!senha_atual || !nova_senha || nova_senha.length < 6) {
      return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias' });
    }
    
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    const senhaAtualValida = await bcrypt.compare(senha_atual, usuario.senha);
    if (!senhaAtualValida) {
      return res.status(422).json({ erro: 'Senha atual incorreta' });
    }

    const senhaHash = await bcrypt.hash(nova_senha, 10);
    
    await usuario.update({ senha: senhaHash });
    
    res.json({ mensagem: 'Senha alterada com sucesso' });
    
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.deleteMe = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ erro: 'Usuário não autenticado' });
    }
    
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    await usuario.update({ ativo: false });
    
    res.json({ mensagem: 'Conta inativada com sucesso' });
    
  } catch (error) {
    console.error('Erro ao inativar conta:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.obterUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
      attributes: ['id', 'nome', 'email', 'role_id', 'ativo', 'criado_em', 'telefone']
    });
    
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    res.json(serializeUsuario(usuario));
    
  } catch (error) {
    console.error('Erro ao obter usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.criarUsuario = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (userRole === 'Aluno') {
      return res.status(403).json({ 
        erro: 'Acesso negado. Alunos não podem criar usuários.' 
      });
    }
    
    const { nome, email, senha, role_id = 3, telefone } = req.body;
    
    if (userRole === 'Professor' && Number(role_id) === 1) {
      return res.status(403).json({ 
        erro: 'Professores não podem criar usuários com perfil Admin.' 
      });
    }
    
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, email e senha são obrigatórios' });
    }
    
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email já está em uso' });
    }
    
    const senhaHash = await bcrypt.hash(senha, 10);
    
    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      role_id,
      telefone,
      ativo: true
    });

    
    res.status(201).json(serializeUsuario(novoUsuario));
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone, role_id } = req.body;
    const dadosAtualizacao = { nome, email, telefone, role_id };
    Object.keys(dadosAtualizacao).forEach(key => dadosAtualizacao[key] === undefined && delete dadosAtualizacao[key]);
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    if (req.user.role === 'Professor' && (Number(usuario.role_id) === 1 || Number(role_id) === 1)) {
      return res.status(403).json({ erro: 'Professores não podem administrar usuários Admin' });
    }
    
    await usuario.update(dadosAtualizacao);
    
    res.json(serializeUsuario(usuario));
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.deletarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }

    if (req.user.role === 'Professor' && Number(usuario.role_id) === 1) {
      return res.status(403).json({ erro: 'Professores não podem desativar usuários Admin' });
    }
    
    await usuario.update({ ativo: false });
    res.json({ mensagem: 'Usuário desativado com sucesso' });
    
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.buscarUsuariosParaVinculacao = async (req, res) => {
  try {
    const { search } = req.query;
    
    if (!search || search.length < 3) {
      return res.json([]);
    }
    
    const usuarios = await Usuario.findAll({
      where: {
        ativo: true,
        role_id: [1, 2, 3],
        [require('sequelize').Op.or]: [
          { nome: { [require('sequelize').Op.like]: `%${search}%` } },
          { email: { [require('sequelize').Op.like]: `%${search}%` } }
        ]
      },
      include: [{ model: Role, as: 'role' }],
      attributes: ['id', 'nome', 'email', 'role_id'],
      order: [['nome', 'ASC']],
      limit: 10
    });
    
    res.json(usuarios.map(serializeUsuario));
    
  } catch (error) {
    console.error('Erro ao buscar usuários para vinculação:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.reativarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ erro: 'Usuário não encontrado' });
    }
    
    await usuario.update({ ativo: true });
    
    res.json({ 
      message: 'Usuário reativado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        ativo: usuario.ativo
      }
    });
    
  } catch (error) {
    console.error('Erro ao reativar usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    if (userRole === 'Aluno') {
      return res.status(403).json({ 
        erro: 'Acesso negado. Alunos não podem listar usuários.' 
      });
    }
    
    let whereClause = {};
    
    if (userRole === 'Professor') {
      whereClause = {
        role_id: [2, 3],
        ativo: true
      };
    } else if (userRole === 'Admin') {
      whereClause = {};
    }
    
    const usuarios = await Usuario.findAll({
      where: whereClause,
      include: [{ model: Role, as: 'role' }],
      attributes: ['id', 'nome', 'email', 'role_id', 'ativo', 'criado_em', 'telefone'],
      order: [['nome', 'ASC']]
    });
    
    res.json(usuarios.map(serializeUsuario));
    
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
