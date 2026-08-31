const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

class Usuario extends Model {
  static associate(models) {
    Usuario.belongsTo(models.roleModel, { foreignKey: 'role_id', as: 'role' });
    Usuario.hasMany(models.atualizacaoProcessoModel, { foreignKey: 'usuario_id', as: 'atualizacoes' });
    Usuario.hasMany(models.arquivoModel, { foreignKey: 'usuario_id', as: 'arquivos' });
    Usuario.hasMany(models.usuarioProcessoModel, { foreignKey: 'usuario_id', as: 'usuariosProcesso' });
    Usuario.hasMany(models.processoModel, { foreignKey: 'idusuario_responsavel', as: 'processosResponsavel' });
    
    Usuario.hasMany(models.agendamentoModel, { foreignKey: 'criado_por', as: 'agendamentosCriados' });
    Usuario.hasMany(models.agendamentoModel, { foreignKey: 'aprovado_por', as: 'agendamentosAprovados' });
  }

  static async usuarioCompleto(id) {
    const { roleModel } = require('./indexModel');
    return await Usuario.findByPk(id, {
      include: [{ model: roleModel, as: 'role' }]
    });
  }
}

Usuario.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    senha: { type: DataTypes.STRING(255), allowNull: false },
    role_id: { type: DataTypes.INTEGER, allowNull: false },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ativo: { type: DataTypes.BOOLEAN, defaultValue: true },
    telefone: { type: DataTypes.STRING(20) }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    timestamps: false
  }
);

module.exports = Usuario;
