const bcrypt = require('bcrypt');
const Usuario = require('../models/usuarioModel');
const Role = require('../models/roleModel');

const DEFAULT_TEST_PASSWORD = 'TesteNPJ@2026';

function getTestUsers() {
  return [
    {
      nome: 'Professor Teste 1',
      email: process.env.TEST_PROFESSOR_1_EMAIL || 'professor1@npj.local',
      password: process.env.TEST_PROFESSOR_1_PASSWORD || DEFAULT_TEST_PASSWORD,
      role: 'Professor'
    },
    {
      nome: 'Professor Teste 2',
      email: process.env.TEST_PROFESSOR_2_EMAIL || 'professor2@npj.local',
      password: process.env.TEST_PROFESSOR_2_PASSWORD || DEFAULT_TEST_PASSWORD,
      role: 'Professor'
    },
    {
      nome: 'Aluno Teste 1',
      email: process.env.TEST_ALUNO_1_EMAIL || 'aluno1@npj.local',
      password: process.env.TEST_ALUNO_1_PASSWORD || DEFAULT_TEST_PASSWORD,
      role: 'Aluno'
    },
    {
      nome: 'Aluno Teste 2',
      email: process.env.TEST_ALUNO_2_EMAIL || 'aluno2@npj.local',
      password: process.env.TEST_ALUNO_2_PASSWORD || DEFAULT_TEST_PASSWORD,
      role: 'Aluno'
    }
  ];
}

async function seedTestUsers() {
  const users = getTestUsers();
  const missingConfig = users
    .filter(user => !user.email || !user.password)
    .map(user => user.role);

  if (missingConfig.length > 0) {
    throw new Error(`Credenciais ausentes para os perfis: ${missingConfig.join(', ')}`);
  }

  const weakPassword = users.find(user => user.password.length < 12);
  if (weakPassword) {
    throw new Error(`A senha do perfil ${weakPassword.role} deve ter no mínimo 12 caracteres`);
  }

  const roles = await Role.findAll({ where: { nome: [...new Set(users.map(user => user.role))] } });
  const roleByName = new Map(roles.map(role => [role.nome, role.id]));

  for (const user of users) {
    const roleId = roleByName.get(user.role);
    if (!roleId) {
      throw new Error(`Role ${user.role} não encontrada. Execute as migrations primeiro.`);
    }

    const existingUser = await Usuario.findOne({ where: { email: user.email } });
    if (existingUser) {
      console.log(` Usuário inicial já existe: ${user.email}`);
      continue;
    }

    await Usuario.create({
      nome: user.nome,
      email: user.email,
      senha: await bcrypt.hash(user.password, 10),
      role_id: roleId,
      ativo: true,
      telefone: user.telefone || null
    });
    console.log(` Usuário inicial criado: ${user.email} (${user.role})`);
  }
}

module.exports = { seedTestUsers, getTestUsers, DEFAULT_TEST_PASSWORD };
