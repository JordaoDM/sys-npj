const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class Diligencia extends Model {}

Diligencia.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true }
  },
  {
    sequelize,
    modelName: 'Diligencia',
    tableName: 'diligencia',
    timestamps: false
  }
);

module.exports = Diligencia;
