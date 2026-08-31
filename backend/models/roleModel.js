const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class Role extends Model {
  static associate(models) {
    Role.hasMany(models.usuarioModel, { foreignKey: 'role_id', as: 'usuarios' });
  }
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(50), allowNull: false, unique: true }
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    timestamps: false
  }
);

module.exports = Role;
