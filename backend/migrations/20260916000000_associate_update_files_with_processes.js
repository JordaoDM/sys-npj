'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(`
      UPDATE arquivos AS arquivo
      INNER JOIN (
        SELECT arquivos_id, MIN(processo_id) AS processo_id
        FROM atualizacoes_processo
        WHERE arquivos_id IS NOT NULL
        GROUP BY arquivos_id
        HAVING COUNT(DISTINCT processo_id) = 1
      ) AS vinculo ON vinculo.arquivos_id = arquivo.id
      SET arquivo.processo_id = vinculo.processo_id
      WHERE arquivo.processo_id IS NULL
    `);
  },

  down: async () => {
    // Associação histórica não é removida para evitar perda de informação.
  }
};
