require('dotenv').config({
  path: require('path').resolve(__dirname, '../../env/main.env'),
  quiet: true
});

const MigrationRunner = require('../utils/migrationRunner');

async function main() {
  const command = process.argv[2] || 'up';
  const runner = new MigrationRunner();

  if (command === 'up') {
    await runner.runMigrations();
    return;
  }

  if (command === 'check') {
    const pending = await runner.checkMigrations();
    if (pending.length > 0) process.exitCode = 1;
    return;
  }

  throw new Error(`Comando desconhecido: ${command}. Use "up" ou "check".`);
}

main()
  .catch(error => {
    console.error(` Falha no comando de migration: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    const sequelize = require('../utils/sequelize');
    await sequelize.close();
  });
