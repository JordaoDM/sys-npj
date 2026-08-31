require('dotenv').config({ path: require('path').resolve(__dirname, '../../env/main.env'), quiet: true });

function databaseConfig(databaseName = process.env.DB_NAME) {
  return {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: databaseName,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4'
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  };
}

module.exports = {
  development: databaseConfig(),
  test: databaseConfig(process.env.DB_TEST_NAME || process.env.DB_NAME),
  production: databaseConfig()
};
