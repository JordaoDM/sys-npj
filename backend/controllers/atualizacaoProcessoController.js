const { Op } = require('sequelize');
const {
  atualizacaoProcessoModel: Atualizacao,
  usuarioModel: Usuario,
  processoModel: Processo,
  arquivoModel: Arquivo,
  usuarioProcessoModel: UsuarioProcesso
} = require('../models/indexModel');

const includes = [
  { model: Usuario, as: 'usuario', attributes: ['id', 'nome', 'email'] },
  { model: Processo, as: 'processo', attributes: ['id', 'numero_processo', 'titulo', 'status'] },
  { model: Arquivo, as: 'arquivo', attributes: ['id', 'nome', 'nome_original', 'caminho'], required: false }
];

const isPrivileged = (user) => ['Admin', 'Professor'].includes(user.role?.nome || user.role);

async function usuarioPodeAcessarProcesso(user, processoId) {
  if (isPrivileged(user)) return true;

  const [processo, vinculo] = await Promise.all([
    Processo.findByPk(processoId, { attributes: ['idusuario_responsavel'] }),
    UsuarioProcesso.findOne({ where: { processo_id: processoId, usuario_id: user.id }, attributes: ['id'] })
  ]);

  return Boolean(processo) && (
    Number(processo.idusuario_responsavel) === Number(user.id) || Boolean(vinculo)
  );
}

async function validarArquivo(arquivoId, processoId, user) {
  if (!arquivoId) return null;

  const arquivo = await Arquivo.findOne({ where: { id: arquivoId, ativo: true } });
  if (!arquivo) return { status: 404, message: 'Arquivo não encontrado' };
  if (arquivo.processo_id && Number(arquivo.processo_id) !== Number(processoId)) {
    return { status: 400, message: 'O arquivo pertence a outro processo' };
  }
  if (!isPrivileged(user) && Number(arquivo.usuario_id) !== Number(user.id)) {
    return { status: 403, message: 'Sem permissão para vincular este arquivo' };
  }
  return null;
}

exports.listarAtualizacoes = async (req, res) => {
  try {
    const processoId = req.query.processo_id;
    const where = {};

    if (processoId) {
      if (!(await usuarioPodeAcessarProcesso(req.user, processoId))) {
        return res.status(403).json({ success: false, message: 'Acesso negado a este processo' });
      }
      where.processo_id = processoId;
    } else if (!isPrivileged(req.user)) {
      const vinculos = await UsuarioProcesso.findAll({
        where: { usuario_id: req.user.id },
        attributes: ['processo_id'],
        raw: true
      });
      const processos = await Processo.findAll({
        where: {
          [Op.or]: [
            { idusuario_responsavel: req.user.id },
            { id: { [Op.in]: vinculos.map(item => item.processo_id) } }
          ]
        },
        attributes: ['id'],
        raw: true
      });
      where.processo_id = { [Op.in]: processos.map(item => item.id) };
    }

    const atualizacoes = await Atualizacao.findAll({
      where,
      include: includes,
      order: [['data_atualizacao', 'DESC']]
    });

    return res.json({ success: true, data: atualizacoes });
  } catch (error) {
    console.error('Erro ao listar atualizações:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.obterAtualizacao = async (req, res) => {
  try {
    const atualizacao = await Atualizacao.findByPk(req.params.id, { include: includes });
    if (!atualizacao) {
      return res.status(404).json({ success: false, message: 'Atualização não encontrada' });
    }
    if (!(await usuarioPodeAcessarProcesso(req.user, atualizacao.processo_id))) {
      return res.status(403).json({ success: false, message: 'Acesso negado a este processo' });
    }
    return res.json({ success: true, data: atualizacao });
  } catch (error) {
    console.error('Erro ao obter atualização:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.criarAtualizacao = async (req, res) => {
  try {
    const { processo_id, tipo_atualizacao, descricao, arquivo_id } = req.body;
    const processo = await Processo.findByPk(processo_id);
    if (!processo) {
      return res.status(404).json({ success: false, message: 'Processo não encontrado' });
    }
    if (processo.status === 'Concluído') {
      return res.status(403).json({ success: false, message: 'Processo concluído não pode receber atualizações. Reabra para modificar.' });
    }

    const arquivoError = await validarArquivo(arquivo_id, processo_id, req.user);
    if (arquivoError) {
      return res.status(arquivoError.status).json({ success: false, message: arquivoError.message });
    }

    const criada = await Atualizacao.create({
      processo_id,
      usuario_id: req.user.id,
      tipo_atualizacao: tipo_atualizacao.trim(),
      descricao: descricao.trim(),
      arquivos_id: arquivo_id || null
    });
    const atualizacao = await Atualizacao.findByPk(criada.id, { include: includes });
    return res.status(201).json({ success: true, message: 'Atualização cadastrada com sucesso', data: atualizacao });
  } catch (error) {
    console.error('Erro ao criar atualização:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.atualizarAtualizacao = async (req, res) => {
  try {
    const atualizacao = await Atualizacao.findByPk(req.params.id);
    if (!atualizacao) {
      return res.status(404).json({ success: false, message: 'Atualização não encontrada' });
    }
    const processo = await Processo.findByPk(atualizacao.processo_id);
    if (processo?.status === 'Concluído') {
      return res.status(403).json({ success: false, message: 'Processo concluído não pode ser alterado. Reabra para modificar.' });
    }

    const arquivoError = await validarArquivo(req.body.arquivo_id, atualizacao.processo_id, req.user);
    if (arquivoError) {
      return res.status(arquivoError.status).json({ success: false, message: arquivoError.message });
    }

    const dados = {};
    if (req.body.tipo_atualizacao !== undefined) dados.tipo_atualizacao = req.body.tipo_atualizacao.trim();
    if (req.body.descricao !== undefined) dados.descricao = req.body.descricao.trim();
    if (req.body.arquivo_id !== undefined) dados.arquivos_id = req.body.arquivo_id || null;
    await atualizacao.update(dados);

    const atualizada = await Atualizacao.findByPk(atualizacao.id, { include: includes });
    return res.json({ success: true, message: 'Atualização alterada com sucesso', data: atualizada });
  } catch (error) {
    console.error('Erro ao atualizar atualização:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};

exports.deletarAtualizacao = async (req, res) => {
  try {
    const atualizacao = await Atualizacao.findByPk(req.params.id);
    if (!atualizacao) {
      return res.status(404).json({ success: false, message: 'Atualização não encontrada' });
    }
    const processo = await Processo.findByPk(atualizacao.processo_id);
    if (processo?.status === 'Concluído') {
      return res.status(403).json({ success: false, message: 'Processo concluído não pode ser alterado. Reabra para modificar.' });
    }
    await atualizacao.destroy();
    return res.json({ success: true, message: 'Atualização excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir atualização:', error);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
};
