const { processoModel: Processo, usuarioProcessoModel: UsuarioProcesso } = require('../models/indexModel');

async function verificarAcessoProcesso(user, processoId) {
  if (!Number.isInteger(processoId) || processoId < 1) {
    return { permitido: false, motivo: 'invalido' };
  }

  const processo = await Processo.findByPk(processoId, {
    attributes: ['id', 'idusuario_responsavel', 'status']
  });
  if (!processo) return { permitido: false, motivo: 'nao_encontrado' };

  if (user.role === 'Admin' || user.role === 'Professor') {
    return { permitido: true, processo };
  }

  const vinculo = await UsuarioProcesso.findOne({
    where: { processo_id: processoId, usuario_id: user.id }
  });
  const permitido = Number(processo.idusuario_responsavel) === Number(user.id) || Boolean(vinculo);
  return { permitido, processo, motivo: permitido ? null : 'negado' };
}

async function canAccessProcess(req, res, next) {
  try {
    const processoId = Number(req.params.id || req.params.processoId || req.body.processo_id);
    const acesso = await verificarAcessoProcesso(req.user, processoId);
    if (acesso.motivo === 'invalido') {
      return res.status(400).json({ erro: 'ID do processo inválido' });
    }
    if (acesso.motivo === 'nao_encontrado') {
      return res.status(404).json({ erro: 'Processo não encontrado' });
    }
    if (!acesso.permitido) {
      return res.status(403).json({ erro: 'Acesso negado a este processo' });
    }

    next();
  } catch (error) {
    console.error('Erro ao validar acesso ao processo:', error.message);
    res.status(500).json({ erro: 'Erro ao validar permissão do processo' });
  }
}

module.exports = { canAccessProcess, verificarAcessoProcesso };
