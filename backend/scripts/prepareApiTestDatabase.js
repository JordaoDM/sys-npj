const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '../../env/main.env'), quiet: true });

const testDatabase = process.env.TEST_DB_NAME || 'npj_test';
const developmentDatabase = process.env.DB_NAME;

function assertSafeDatabaseName(name) {
  if (!/^[a-zA-Z0-9_]+_test$/.test(name)) {
    throw new Error(`Banco de testes inseguro: "${name}". O nome deve terminar com _test.`);
  }
  if (name === developmentDatabase) {
    throw new Error('O banco de testes não pode ser o mesmo banco configurado para a aplicação.');
  }
}

async function prepare() {
  assertSafeDatabaseName(testDatabase);

  const host = process.env.TEST_DB_HOST || '127.0.0.1';
  const port = Number(process.env.TEST_DB_PORT || process.env.DB_HOST_PORT || 3306);
  const rootUser = process.env.TEST_DB_ROOT_USER || 'root';
  const rootPassword = process.env.TEST_DB_ROOT_PASSWORD || process.env.DB_ROOT_PASSWORD;
  const applicationUser = process.env.TEST_DB_USER || process.env.DB_USER;

  if (!rootPassword || !applicationUser) {
    throw new Error('Defina DB_ROOT_PASSWORD e DB_USER no .env para preparar o banco de testes.');
  }

  const connection = await mysql.createConnection({
    host,
    port,
    user: rootUser,
    password: rootPassword,
    multipleStatements: false
  });

  try {
    const escapedDatabase = connection.escapeId(testDatabase);
    const escapedUser = connection.escape(applicationUser);

    await connection.query(`DROP DATABASE IF EXISTS ${escapedDatabase}`);
    await connection.query(
      `CREATE DATABASE ${escapedDatabase} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`GRANT ALL PRIVILEGES ON ${escapedDatabase}.* TO ${escapedUser}@'%'`);
    await connection.query('FLUSH PRIVILEGES');
  } finally {
    await connection.end();
  }

  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = host;
  process.env.DB_PORT = String(port);
  process.env.DB_NAME = testDatabase;
  process.env.DB_USER = applicationUser;
  process.env.DB_PASSWORD = process.env.TEST_DB_PASSWORD || process.env.DB_PASSWORD;

  const MigrationRunner = require('../utils/migrationRunner');
  await new MigrationRunner().runMigrations();
  console.log(`Banco de testes preparado com segurança: ${testDatabase}`);
}

prepare().catch((error) => {
  console.error(`Falha ao preparar banco de testes: ${error.message}`);
  process.exit(1);
});
