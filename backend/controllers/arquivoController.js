exports.listarArquivosPorUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    if (userRole === 'Aluno' && parseInt(id) !== userId) {
      return res.status(403).json({ 
        erro: 'Acesso negado. Alunos só podem visualizar seus próprios arquivos.' 
      });
    }
    
    const { arquivoModel: Arquivo, usuarioModel: Usuario, processoModel: Processo } = require('../models/indexModel');
    const arquivos = await Arquivo.findAll({
      where: { usuario_id: id, ativo: true },
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nome', 'email'] },
        { model: Processo, as: 'processo', attributes: ['id', 'numero_processo', 'titulo'], required: false }
      ],
      order: [['criado_em', 'DESC']]
    });
    res.json(arquivos);
  } catch (error) {
    console.error('Erro ao listar arquivos do usuário:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

const path = require('path');
const fs = require('fs');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { verificarAcessoProcesso } = require('../middleware/processAccessMiddleware');

function removerUploadTemporario(req) {
  if (req.file?.path && fs.existsSync(req.file.path)) {
    try { fs.unlinkSync(req.file.path); } catch (error) {
      console.error('Erro ao remover upload rejeitado:', error.message);
    }
  }
}

function podeAcessarArquivo(req, arquivo) {
  return req.user.role === 'Admin' ||
    req.user.role === 'Professor' ||
    Number(arquivo.usuario_id) === Number(req.user.id);
}

exports.uploadArquivo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo foi enviado' });
    }
    const { processo_id, usuario_id, nome, descricao } = req.body;
    if (processo_id) {
      const acesso = await verificarAcessoProcesso(req.user, Number(processo_id));
      if (acesso.motivo === 'invalido') {
        removerUploadTemporario(req);
        return res.status(400).json({ erro: 'ID do processo inválido' });
      }
      if (acesso.motivo === 'nao_encontrado') {
        removerUploadTemporario(req);
        return res.status(404).json({ erro: 'Processo não encontrado' });
      }
      if (!acesso.permitido) {
        removerUploadTemporario(req);
        return res.status(403).json({ erro: 'Acesso negado a este processo' });
      }
      if (acesso.processo.status === 'Concluído') {
        removerUploadTemporario(req);
        return res.status(403).json({ erro: 'Processo concluído não pode receber novos documentos. Reabra para modificar.' });
      }
    }
    const arquivoData = {
      nome: nome || req.file.originalname,
      nome_original: req.file.originalname,
      descricao: descricao || null,
      caminho: `/uploads/${req.file.filename}`,
      tamanho: req.file.size,
      tipo: req.file.mimetype,
      processo_id: processo_id ? parseInt(processo_id) : null,
      usuario_id: (req.user.role === 'Admin' || req.user.role === 'Professor') && usuario_id
        ? parseInt(usuario_id)
        : req.user.id
    };
    const { arquivoModel: Arquivo } = require('../models/indexModel');
    const novoArquivo = await Arquivo.create(arquivoData);
    res.status(201).json(novoArquivo);
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ erro: 'Erro interno do servidor', detalhes: error.message });
  }
};

exports.listarArquivos = async (req, res) => {
  try {
    const { processo_id, incluir_inativos } = req.query;
    const processoId = processo_id;
    const userRole = req.user.role;
    const userId = req.user.id;
    
    const { arquivoModel: Arquivo, usuarioModel: Usuario, processoModel: Processo } = require('../models/indexModel');

    if (processoId) {
      const acesso = await verificarAcessoProcesso(req.user, Number(processoId));
      if (acesso.motivo === 'invalido') return res.status(400).json({ erro: 'ID do processo inválido' });
      if (acesso.motivo === 'nao_encontrado') return res.status(404).json({ erro: 'Processo não encontrado' });
      if (!acesso.permitido) return res.status(403).json({ erro: 'Acesso negado a este processo' });
    }
    
    const where = processoId ? { processo_id: processoId } : {};
    
    if (userRole === 'Aluno') {
      where.usuario_id = userId;
    }
    
    if (incluir_inativos !== 'true') {
      where.ativo = true;
    }
    
    const arquivos = await Arquivo.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nome', 'email'] },
        { model: Processo, as: 'processo', attributes: ['id', 'numero_processo', 'titulo'], required: false }
      ],
      order: [['criado_em', 'DESC']]
    });
    res.json(arquivos);
  } catch (error) {
    console.error('Erro ao listar arquivos:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.obterArquivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { arquivoModel: Arquivo, usuarioModel: Usuario } = require('../models/indexModel');
    const arquivo = await Arquivo.findByPk(id, {
      include: [{ model: Usuario, as: 'usuario' }]
    });
    if (!arquivo) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
    if (!podeAcessarArquivo(req, arquivo)) {
      return res.status(403).json({ erro: 'Acesso negado a este arquivo' });
    }
    res.json(arquivo);
  } catch (error) {
    console.error('Erro ao obter arquivo:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.downloadArquivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { arquivoModel: Arquivo } = require('../models/indexModel');
    const arquivo = await Arquivo.findByPk(id);
    if (!arquivo) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
    if (!podeAcessarArquivo(req, arquivo)) {
      return res.status(403).json({ erro: 'Acesso negado a este arquivo' });
    }
    const nomeArquivo = arquivo.caminho.split('/').pop();
    const caminhoArquivo = path.join(__dirname, '../uploads', nomeArquivo);
    if (!fs.existsSync(caminhoArquivo)) {
      return res.status(404).json({ erro: 'Arquivo físico não encontrado' });
    }
    const nomeDownload = arquivo.nome_original || arquivo.nome || nomeArquivo;
    res.download(caminhoArquivo, nomeDownload);
  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

exports.deletarArquivo = async (req, res) => {
  try {
    const { id } = req.params;
    const { arquivoModel: Arquivo, processoModel: Processo } = require('../models/indexModel');
    const arquivo = await Arquivo.findByPk(id);
    if (!arquivo) {
      return res.status(404).json({ erro: 'Arquivo não encontrado' });
    }
    if (!podeAcessarArquivo(req, arquivo)) {
      return res.status(403).json({ erro: 'Acesso negado a este arquivo' });
    }
    if (arquivo.processo_id) {
      const processo = await Processo.findByPk(arquivo.processo_id);
      if (processo && processo.status === 'Concluído') {
        return res.status(403).json({ erro: 'Processo concluído não pode ser alterado. Reabra para modificar.' });
      }
    }
    await arquivo.update({ ativo: false });
    if (!arquivo.processo_id) {
      const nomeArquivo = arquivo.caminho.split('/').pop();
      const caminhoArquivo = path.join(__dirname, '../uploads', nomeArquivo);
      if (fs.existsSync(caminhoArquivo)) {
        try {
          fs.unlinkSync(caminhoArquivo);
        } catch (fsError) {
          console.log('Erro ao deletar arquivo físico:', fsError.message);
        }
      }
    }
    res.json({ 
      message: 'Arquivo removido com sucesso',
      vinculado_processo: !!arquivo.processo_id,
      info: arquivo.processo_id ? 'Arquivo mantido no processo para preservar histórico' : 'Arquivo completamente removido'
    });
  } catch (error) {
    console.error('Erro ao deletar arquivo:', error);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};
