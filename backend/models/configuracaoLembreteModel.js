const { DataTypes, Model } = require('sequelize');
const sequelize = require('../utils/sequelize');

const CONFIGURACAO_PADRAO = Object.freeze({
  id: 1,
  lembrete_24h_ativo: true,
  lembrete_dia_ativo: true,
  horario_lembrete_dia: '08:00:00',
  lembrete_antecipado_ativo: true,
  antecedencia_minutos: 60,
  fuso_horario: 'America/Sao_Paulo'
});

class ConfiguracaoLembrete extends Model {
  static associate(models) {
    ConfiguracaoLembrete.belongsTo(models.usuarioModel, {
      foreignKey: 'alterado_por',
      as: 'alteradoPor'
    });
  }

  static get padrao() {
    return { ...CONFIGURACAO_PADRAO };
  }
}

ConfiguracaoLembrete.init({
  id: {
    type: DataTypes.TINYINT.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    defaultValue: 1,
    validate: {
      isIn: {
        args: [[1]],
        msg: 'A configuração global deve utilizar o ID 1'
      }
    }
  },
  lembrete_24h_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: CONFIGURACAO_PADRAO.lembrete_24h_ativo
  },
  lembrete_dia_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: CONFIGURACAO_PADRAO.lembrete_dia_ativo
  },
  horario_lembrete_dia: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: CONFIGURACAO_PADRAO.horario_lembrete_dia
  },
  lembrete_antecipado_ativo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: CONFIGURACAO_PADRAO.lembrete_antecipado_ativo
  },
  antecedencia_minutos: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: CONFIGURACAO_PADRAO.antecedencia_minutos,
    validate: {
      min: { args: [1], msg: 'A antecedência mínima é de 1 minuto' },
      max: { args: [10080], msg: 'A antecedência máxima é de 7 dias' }
    }
  },
  fuso_horario: {
    type: DataTypes.STRING(64),
    allowNull: false,
    defaultValue: CONFIGURACAO_PADRAO.fuso_horario,
    validate: {
      notEmpty: { msg: 'Fuso horário é obrigatório' },
      isFusoHorarioValido(value) {
        try {
          new Intl.DateTimeFormat('pt-BR', { timeZone: value }).format();
        } catch (_error) {
          throw new Error('Fuso horário inválido');
        }
      }
    }
  },
  alterado_por: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'usuarios', key: 'id' }
  }
}, {
  sequelize,
  modelName: 'ConfiguracaoLembrete',
  tableName: 'configuracoes_lembretes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ConfiguracaoLembrete;
