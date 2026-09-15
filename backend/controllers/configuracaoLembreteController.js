const { configuracaoLembreteModel: ConfiguracaoLembrete, usuarioModel: Usuario } = require('../models/indexModel');

const INCLUDE_AUDITORIA = [{
  model: Usuario,
  as: 'alteradoPor',
  attributes: ['id', 'nome', 'email'],
  required: false
}];

async function obterOuCriar() {
  const [configuracao] = await ConfiguracaoLembrete.findOrCreate({
    where: { id: 1 },
    defaults: ConfiguracaoLembrete.padrao
  });

  return ConfiguracaoLembrete.findByPk(configuracao.id, { include: INCLUDE_AUDITORIA });
}

exports.obter = async (_req, res) => {
  try {
    const configuracao = await obterOuCriar();
    return res.json({ success: true, data: configuracao });
  } catch (error) {
    console.error('Erro ao obter configuração de lembretes:', error.message);
    return res.status(500).json({ success: false, message: 'Erro ao obter configuração de lembretes' });
  }
};

exports.atualizar = async (req, res) => {
  try {
    const configuracao = await obterOuCriar();
    await configuracao.update({
      ...req.body,
      alterado_por: req.user.id
    });
    await configuracao.reload({ include: INCLUDE_AUDITORIA });

    return res.json({
      success: true,
      message: 'Configuração de lembretes atualizada com sucesso',
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao atualizar configuração de lembretes:', error.message);
    return res.status(500).json({ success: false, message: 'Erro ao atualizar configuração de lembretes' });
  }
};

exports.restaurarPadrao = async (req, res) => {
  try {
    const configuracao = await obterOuCriar();
    await configuracao.update({
      ...ConfiguracaoLembrete.padrao,
      alterado_por: req.user.id
    });
    await configuracao.reload({ include: INCLUDE_AUDITORIA });

    return res.json({
      success: true,
      message: 'Configuração padrão de lembretes restaurada com sucesso',
      data: configuracao
    });
  } catch (error) {
    console.error('Erro ao restaurar configuração de lembretes:', error.message);
    return res.status(500).json({ success: false, message: 'Erro ao restaurar configuração de lembretes' });
  }
};
