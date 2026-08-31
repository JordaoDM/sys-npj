const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class Fase extends Model {}

Fase.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true }
  },
  {
    sequelize,
    modelName: 'Fase',
    tableName: 'fase',
    timestamps: false
  }
);

module.exports = Fase;
