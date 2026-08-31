require('dotenv').config({ path: require('path').resolve(__dirname, '../env/main.env'), quiet: true });
require('./utils/productionLogger').configureProductionLogging();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const app = express();

module.exports = app;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(require('./middleware/requestLoggingMiddleware'));
app.use(require('./middleware/responseContractMiddleware'));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));


app.get('/', (req, res) => {
  res.json({ 
    message: 'API Sistema NPJ funcionando!', 
    timestamp: new Date().toISOString(),
    dbAvailable: global.dbAvailable || false,
    version: '1.0.0'
  });
});

require('./routes').mountApplicationRoutes(app);

app.get('/api/system-status', (req, res) => {
  res.json({
    api: 'funcionando',
    database: global.dbAvailable || false,
    routes: {
      auth: true,
      processos: true,
      agendamentos: true,
      individualizados: true
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

const errorHandler = require('./middleware/errorHandlerMiddleware');
app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

async function startServer() {
  const requiredConfig = ['PORT', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingConfig = requiredConfig.filter(name => !process.env[name]);
  if (missingConfig.length > 0) {
    throw new Error(`Variáveis obrigatórias ausentes: ${missingConfig.join(', ')}`);
  }

  require('./config/secrets').getJwtSecret();
  require('./config/secrets').getJwtRefreshSecret();

  const sequelize = require('./utils/sequelize');
  await sequelize.authenticate();
  global.dbAvailable = true;
  console.log(' Banco de dados conectado');

  const MigrationRunner = require('./utils/migrationRunner');
  await new MigrationRunner().runMigrations();

  const createAdminUser = require('./utils/createAdmin');
  await createAdminUser({ closeConnection: false });

  if (process.env.SEED_TEST_USERS !== 'false') {
    const { seedTestUsers } = require('./utils/seedInitialUsers');
    await seedTestUsers();
  } else {
    console.log(' Criação dos usuários de teste desabilitada');
  }

  const lembreteJob = require('./jobs/lembreteJob');
  const agendamentoCronJobs = require('./jobs/agendamentoCronJobs');
  lembreteJob.iniciar();
  agendamentoCronJobs.iniciar();

  const port = Number(process.env.PORT);
  return app.listen(port, () => {
    console.log(` Servidor rodando na porta ${port}`);
  });
}

module.exports.startServer = startServer;

if (require.main === module) {
  startServer().catch(error => {
    global.dbAvailable = false;
    console.error(' Falha ao iniciar servidor:', error.message);
    process.exit(1);
  });
}
