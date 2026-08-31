
const bcrypt = require('bcrypt');
const sequelize = require('./sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../env/main.env'), quiet: true });
const Usuario = require('../models/usuarioModel');
const Role = require('../models/roleModel');

async function createAdminUser({ closeConnection = true } = {}) {
  try {
    await sequelize.authenticate();
    console.log(' Conexão com banco de dados estabelecida.');

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL é obrigatório');
    }

    const adminExists = await Usuario.findOne({
      where: { email: adminEmail }
    });

    if (adminExists) {
      console.log('️  Usuário admin já existe.');
      return;
    }

    if (!adminPassword || adminPassword.length < 12) {
      throw new Error('ADMIN_PASSWORD com no mínimo 12 caracteres é obrigatória para criar o administrador');
    }

    const adminRole = await Role.findOne({
      where: { nome: 'Admin' }
    });

    if (!adminRole) {
      throw new Error('Role Admin não encontrada. Execute as migrations primeiro.');
    }

    const senhaHash = await bcrypt.hash(adminPassword, 10);

    const admin = await Usuario.create({
      nome: 'Administrador Sistema',
      email: adminEmail,
      senha: senhaHash,
      role_id: adminRole.id,
      ativo: true,
      telefone: '(65) 99999-9999'
    });

    console.log(' Usuário admin criado com sucesso!');
    console.log(` Email: ${adminEmail}`);

  } catch (error) {
    throw new Error(`Erro ao criar usuário admin: ${error.message}`);
  } finally {
    if (closeConnection) {
      await sequelize.close();
    }
  }
}

if (require.main === module) {
  createAdminUser().catch(error => {
    console.error(` ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = createAdminUser;
