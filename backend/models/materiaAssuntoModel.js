const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class MateriaAssunto extends Model {}

MateriaAssunto.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false, unique: true }
  },
  {
    sequelize,
    modelName: 'MateriaAssunto',
    tableName: 'materia_assunto',
    timestamps: false
  }
);

module.exports = MateriaAssunto;
