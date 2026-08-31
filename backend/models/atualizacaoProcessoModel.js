const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class AtualizacoesProcesso extends Model {
  static associate(models) {
    AtualizacoesProcesso.belongsTo(models.usuarioModel, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE'
    });
    AtualizacoesProcesso.belongsTo(models.processoModel, {
      foreignKey: 'processo_id',
      as: 'processo',
      onDelete: 'CASCADE'
    });
    AtualizacoesProcesso.belongsTo(models.arquivoModel, {
      foreignKey: 'arquivos_id',
      as: 'arquivo',
      onDelete: 'SET NULL'
    });
  }
}

AtualizacoesProcesso.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    processo_id: { type: DataTypes.INTEGER, allowNull: false },
    arquivos_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    data_atualizacao: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    tipo_atualizacao: { type: DataTypes.STRING, allowNull: false },
    descricao: { type: DataTypes.TEXT }
  },
  {
    sequelize,
    modelName: 'AtualizacoesProcesso',
    tableName: 'atualizacoes_processo',
    timestamps: false
  }
);

module.exports = AtualizacoesProcesso;
