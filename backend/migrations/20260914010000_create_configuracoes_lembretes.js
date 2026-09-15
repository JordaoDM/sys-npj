'use strict';

const CONFIGURACAO_PADRAO = {
  id: 1,
  lembrete_24h_ativo: true,
  lembrete_dia_ativo: true,
  horario_lembrete_dia: '08:00:00',
  lembrete_antecipado_ativo: true,
  antecedencia_minutos: 60,
  fuso_horario: 'America/Sao_Paulo',
  alterado_por: null,
  created_at: new Date(),
  updated_at: new Date()
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tabelas = (await queryInterface.showAllTables())
      .map((tabela) => String(tabela.tableName || tabela).toLowerCase());
    let tabelaCriada = false;

    if (!tabelas.includes('configuracoes_lembretes')) {
      await queryInterface.createTable('configuracoes_lembretes', {
        id: {
          type: Sequelize.TINYINT.UNSIGNED,
          allowNull: false,
          primaryKey: true,
          defaultValue: 1
        },
        lembrete_24h_ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        lembrete_dia_ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        horario_lembrete_dia: {
          type: Sequelize.TIME,
          allowNull: false,
          defaultValue: '08:00:00'
        },
        lembrete_antecipado_ativo: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true
        },
        antecedencia_minutos: {
          type: Sequelize.INTEGER.UNSIGNED,
          allowNull: false,
          defaultValue: 60
        },
        fuso_horario: {
          type: Sequelize.STRING(64),
          allowNull: false,
          defaultValue: 'America/Sao_Paulo'
        },
        alterado_por: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'usuarios', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
      tabelaCriada = true;
    }

    if (tabelaCriada) {
      await queryInterface.addConstraint('configuracoes_lembretes', {
        fields: ['id'],
        type: 'check',
        where: { id: 1 },
        name: 'chk_configuracoes_lembretes_singleton'
      });
    }

    await queryInterface.bulkInsert('configuracoes_lembretes', [CONFIGURACAO_PADRAO], {
      ignoreDuplicates: true
    });
  },

  down: async (queryInterface) => {
    const tabelas = (await queryInterface.showAllTables())
      .map((tabela) => String(tabela.tableName || tabela).toLowerCase());
    if (tabelas.includes('configuracoes_lembretes')) {
      await queryInterface.dropTable('configuracoes_lembretes');
    }
  }
};
