const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class LocalTramitacao extends Model {}

LocalTramitacao.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(255), allowNull: false }
  },
  {
    sequelize,
    modelName: 'LocalTramitacao',
    tableName: 'local_tramitacao',
    timestamps: false
  }
);

module.exports = LocalTramitacao;
