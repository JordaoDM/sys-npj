const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class Arquivo extends Model {
  static associate(models) {
    Arquivo.belongsTo(models.processoModel, { foreignKey: 'processo_id', as: 'processo' });
    Arquivo.belongsTo(models.usuarioModel, { foreignKey: 'usuario_id', as: 'usuario' });
    Arquivo.hasMany(models.atualizacaoProcessoModel, { foreignKey: 'arquivos_id', as: 'atualizacoes' });
  }

  static async anexarAProcesso(arquivo_id, processo_id) {
    const arquivo = await Arquivo.findByPk(arquivo_id);
    if (!arquivo) throw new Error('Arquivo não encontrado');
    arquivo.processo_id = processo_id;
    await arquivo.save();
    return arquivo;
  }
}

Arquivo.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    nome_original: { type: DataTypes.STRING, allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    caminho: { type: DataTypes.STRING, allowNull: false },
    tamanho: { type: DataTypes.INTEGER, allowNull: false },
    tipo: { type: DataTypes.STRING, allowNull: false },
    processo_id: { type: DataTypes.INTEGER },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'Arquivo',
    tableName: 'arquivos',
    timestamps: false
  }
);

module.exports = Arquivo;
