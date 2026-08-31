'use strict';

const fs = require('fs').promises;
const path = require('path');

const REQUIRED_TABLES = [
  'roles',
  'usuarios',
  'diligencia',
  'fase',
  'local_tramitacao',
  'materia_assunto',
  'processos',
  'agendamentos',
  'arquivos',
  'atualizacoes_processo',
  'refresh_tokens',
  'usuarios_processo',
  'logs_acoes'
];

const normalizeTableName = (table) =>
  String(typeof table === 'string' ? table : table.tableName || table).toLowerCase();

async function validateExistingSchema(queryInterface, tables) {
  const missingTables = REQUIRED_TABLES.filter((table) => !tables.has(table));
  if (missingTables.length > 0) {
    throw new Error(
      `Banco incompatível com a baseline consolidada. Tabelas ausentes: ${missingTables.join(', ')}. ` +
      'Use um banco vazio ou restaure uma exportação compatível.'
    );
  }

  const agendamentos = await queryInterface.describeTable('agendamentos');
  const requiredColumns = [
    'data_inicio',
    'data_fim',
    'convidados',
    'lembrete_1h_enviado',
    'cancelado_automaticamente',
    'data_convites_enviados'
  ];
  const missingColumns = requiredColumns.filter((column) => !agendamentos[column]);
  if (missingColumns.length > 0) {
    throw new Error(
      `Banco existente incompleto para adoção da baseline. Colunas ausentes em agendamentos: ${missingColumns.join(', ')}.`
    );
  }

  if (!String(agendamentos.status.type).includes('pendente')) {
    throw new Error('Banco incompatível com a baseline consolidada: o enum agendamentos.status não contém pendente.');
  }
}

function parseSqlStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

module.exports = {
  up: async (queryInterface) => {
    const allTables = await queryInterface.showAllTables();
    const tables = new Set(allTables.map(normalizeTableName));
    const applicationTables = [...tables].filter(
      (table) => !['migrations', 'sequelizemeta'].includes(table)
    );

    if (applicationTables.length > 0) {
      await validateExistingSchema(queryInterface, tables);
      console.log(' Estrutura existente validada e adotada pela baseline consolidada');
      return;
    }

    const schemaPath = path.resolve(__dirname, '../schema/baseline.sql');
    const schemaSql = await fs.readFile(schemaPath, 'utf8');
    const statements = parseSqlStatements(schemaSql);

    for (const statement of statements) {
      await queryInterface.sequelize.query(statement);
    }

    console.log(` Baseline criada: ${REQUIRED_TABLES.length} tabelas de aplicação`);
  },

  down: async () => {
    throw new Error('A baseline consolidada não possui rollback automático. Restaure um backup do banco se necessário.');
  }
};
