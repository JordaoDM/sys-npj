'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const agendamentos = await queryInterface.describeTable('agendamentos');
    if (!agendamentos.lembrete_dia_enviado) {
      await queryInterface.addColumn('agendamentos', 'lembrete_dia_enviado', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Lembrete do dia do agendamento foi enviado'
      });
    }
  },

  down: async (queryInterface) => {
    const agendamentos = await queryInterface.describeTable('agendamentos');
    if (agendamentos.lembrete_dia_enviado) {
      await queryInterface.removeColumn('agendamentos', 'lembrete_dia_enviado');
    }
  }
};
