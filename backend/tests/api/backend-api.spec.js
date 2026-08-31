const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const app = require('../../index');
const sequelize = require('../../utils/sequelize');
const { usuarioModel: Usuario } = require('../../models/indexModel');
const { getJwtSecret } = require('../../config/secrets');

const PASSWORD = 'Teste@123';
const auth = (token) => ({ Authorization: `Bearer ${token}` });

let admin;
let professor;
let aluno;
let adminToken;
let professorToken;
let alunoToken;
let refreshToken;
let alunoRefreshToken;
let processoId;
let agendamentoId;
let arquivoId;
let atualizacaoId;
let materiaId;

async function login(email, senha = PASSWORD) {
  return request(app).post('/api/auth/login').send({ email, senha });
}

beforeAll(async () => {
  await sequelize.authenticate();
  global.dbAvailable = true;

  const senha = await bcrypt.hash(PASSWORD, 10);
  [admin, professor] = await Promise.all([
    Usuario.create({ nome: 'Admin API', email: 'admin.api@teste.local', senha, role_id: 1, ativo: true }),
    Usuario.create({ nome: 'Professor API', email: 'professor.api@teste.local', senha, role_id: 2, ativo: true })
  ]);
});

afterAll(async () => {
  global.dbAvailable = false;
  await sequelize.close();
});

describe('Saúde, erros e autenticação', () => {
  test('expõe a saúde da API e do banco', async () => {
    const root = await request(app).get('/').set('x-request-id', 'health-check-api').expect(200);
    expect(root.body.data.dbAvailable).toBe(true);
    expect(root.headers['x-request-id']).toBe('health-check-api');

    const status = await request(app).get('/api/system-status').expect(200);
    expect(status.body.data).toMatchObject({ api: 'funcionando', database: true });
  });

  test('não recria tabelas legadas do módulo de eventos', async () => {
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME IN ('events', 'event_participants', 'event_notifications')
    `);

    expect(tables).toEqual([]);
  });

  test('retorna 404 padronizado para rota inexistente', async () => {
    const response = await request(app).get('/api/nao-existe').expect(404);
    expect(response.body).toMatchObject({ success: false, message: 'Rota não encontrada' });
  });

  test('recusa rota protegida sem token e com token inválido', async () => {
    await request(app).get('/api/usuarios/me').expect(401);
    await request(app).get('/api/usuarios/me').set(auth('token-invalido')).expect(401);
  });

  test('registra usuário público sempre como Aluno', async () => {
    const response = await request(app).post('/api/auth/registro').send({
      nome: 'Aluno API', email: 'aluno.api@teste.local', senha: PASSWORD, role_id: 1
    }).expect(201);

    expect(response.body.data.usuario.role_id).toBe(3);
    aluno = await Usuario.findByPk(response.body.data.usuario.id);
  });

  test('valida registro duplicado e credenciais incorretas', async () => {
    await request(app).post('/api/auth/registro').send({
      nome: 'Aluno Duplicado', email: aluno.email, senha: PASSWORD
    }).expect(400);
    await login('inexistente@teste.local').then((response) => expect(response.status).toBe(404));
    await login(admin.email, 'senha-errada').then((response) => expect(response.status).toBe(401));
  });

  test('autentica os três perfis e emite access/refresh token', async () => {
    const [adminLogin, professorLogin, alunoLogin] = await Promise.all([
      login(admin.email), login(professor.email), login(aluno.email)
    ]);

    expect([adminLogin.status, professorLogin.status, alunoLogin.status]).toEqual([200, 200, 200]);
    adminToken = adminLogin.body.data.token;
    professorToken = professorLogin.body.data.token;
    alunoToken = alunoLogin.body.data.token;
    alunoRefreshToken = alunoLogin.body.data.refreshToken;
    refreshToken = adminLogin.body.data.refreshToken;
  });

  test('consulta perfil, verifica e renova token', async () => {
    const perfil = await request(app).get('/api/auth/perfil').set(auth(adminToken)).expect(200);
    expect(perfil.body.data.role).toBe('Admin');
    await request(app).get('/api/auth/verificar-token').set(auth(adminToken)).expect(200);

    const refreshed = await request(app).post('/api/auth/refresh').send({ refreshToken }).expect(200);
    expect(refreshed.body.data.token).toEqual(expect.any(String));
    await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalido' }).expect(401);
  });

  test('oferece recuperação e logout sem invalidar indevidamente a requisição', async () => {
    await request(app).post('/api/auth/esqueci-senha').send({ email: aluno.email }).expect(200);
    await request(app).post('/api/auth/esqueci-senha').send({ email: 'nao-existe@teste.local' }).expect(200);
    const logout = await request(app).post('/api/auth/logout').set(auth(alunoToken))
      .send({ refreshToken: alunoRefreshToken }).expect(200);
    expect(logout.body.data.tokens_revogados).toBe(1);
    await request(app).post('/api/auth/refresh').send({ refreshToken: alunoRefreshToken }).expect(401);
    await request(app).post('/api/auth/resetar-senha')
      .send({ token: 'invalido', nova_senha: 'NovaSenha@123' }).expect(401);

    const alunoAtual = await Usuario.findByPk(aluno.id);
    const resetToken = jwt.sign({
      id: aluno.id,
      type: 'password-reset',
      passwordProof: crypto.createHash('sha256').update(alunoAtual.senha).digest('hex')
    }, getJwtSecret(), { expiresIn: '30m' });
    const novaSenha = 'SenhaRedefinida@123';
    await request(app).post('/api/auth/resetar-senha')
      .send({ token: resetToken, nova_senha: novaSenha }).expect(200);
    await login(aluno.email, PASSWORD).then((response) => expect(response.status).toBe(401));
    await login(aluno.email, novaSenha).then((response) => expect(response.status).toBe(200));
    await request(app).post('/api/auth/resetar-senha')
      .send({ token: resetToken, nova_senha: 'OutraSenha@123' }).expect(401);
    await request(app).put('/api/usuarios/me/senha').set(auth(alunoToken))
      .send({ senha_atual: novaSenha, nova_senha: PASSWORD }).expect(200);
  });

  test('valida payloads incompletos de autenticação', async () => {
    await request(app).post('/api/auth/login').send({ email: admin.email }).expect(400);
    await request(app).post('/api/auth/registro').send({ nome: 'Incompleto' }).expect(400);
    await request(app).post('/api/auth/refresh').send({}).expect(400);
    await request(app).get('/api/auth/verificar-token').expect(401);
  });
});

describe('Usuários e permissões', () => {
  test('consulta e atualiza o próprio perfil', async () => {
    await request(app).get('/api/usuarios/me').set(auth(alunoToken)).expect(200);
    const response = await request(app).put('/api/usuarios/me').set(auth(alunoToken))
      .send({ nome: 'Aluno API Atualizado', telefone: '65999999999' }).expect(200);
    expect(response.body.data.nome).toBe('Aluno API Atualizado');
  });

  test('mantém sessão ao rejeitar senha atual incorreta', async () => {
    await request(app).put('/api/usuarios/me/senha').set(auth(alunoToken))
      .send({ senha_atual: 'incorreta', nova_senha: 'Nova@123' }).expect(422);
    await request(app).get('/api/usuarios/me').set(auth(alunoToken)).expect(200);
  });

  test('troca senha sem desconectar a sessão', async () => {
    await request(app).put('/api/usuarios/me/senha').set(auth(alunoToken))
      .send({ senha_atual: PASSWORD, nova_senha: 'Nova@123' }).expect(200);
    await request(app).get('/api/usuarios/me').set(auth(alunoToken)).expect(200);
    await request(app).put('/api/usuarios/me/senha').set(auth(alunoToken))
      .send({ senha_atual: 'Nova@123', nova_senha: PASSWORD }).expect(200);
  });

  test('impede Aluno de listar/criar usuários', async () => {
    await request(app).get('/api/usuarios').set(auth(alunoToken)).expect(403);
    await request(app).post('/api/usuarios').set(auth(alunoToken)).send({
      nome: 'Outro Aluno', email: 'outro@teste.local', senha: PASSWORD, role_id: 3
    }).expect(403);
  });

  test('impede Professor de criar Admin', async () => {
    await request(app).post('/api/usuarios').set(auth(professorToken)).send({
      nome: 'Admin Indevido', email: 'indevido@teste.local', senha: PASSWORD, role_id: 1
    }).expect(403);
  });

  test('Admin executa CRUD administrativo e busca para vinculação', async () => {
    const created = await request(app).post('/api/usuarios').set(auth(adminToken)).send({
      nome: 'Aluno Gerenciado', email: 'gerenciado@teste.local', senha: PASSWORD, role_id: 3
    }).expect(201);
    const id = created.body.data.id;

    await request(app).get('/api/usuarios').set(auth(adminToken)).expect(200);
    await request(app).get('/api/usuarios/alunos').set(auth(adminToken)).expect(200);
    await request(app).get(`/api/usuarios/${id}`).set(auth(adminToken)).expect(200);
    await request(app).put(`/api/usuarios/${id}`).set(auth(adminToken))
      .send({ nome: 'Aluno Gerenciado Editado' }).expect(200);
    const search = await request(app).get('/api/usuarios/para-vinculacao?search=Gerenciado')
      .set(auth(adminToken)).expect(200);
    expect(search.body.data.length).toBeGreaterThan(0);
    await request(app).put(`/api/usuarios/${id}/senha`).set(auth(adminToken))
      .send({ senha: 'Gerenciada@123' }).expect(200);
    await request(app).delete(`/api/usuarios/${id}`).set(auth(adminToken)).expect(200);
    await request(app).put(`/api/usuarios/${id}/reativar`).set(auth(adminToken)).expect(200);
  });

  test('valida IDs e restringe redefinição administrativa de senha', async () => {
    await request(app).get('/api/usuarios/abc').set(auth(adminToken)).expect(400);
    await request(app).get('/api/usuarios/999999').set(auth(adminToken)).expect(404);
    await request(app).put(`/api/usuarios/${aluno.id}/senha`).set(auth(professorToken))
      .send({ senha: 'ProfessorNaoPode@123' }).expect(403);
  });

  test('permite que um usuário autenticado exclua a própria conta', async () => {
    const registered = await request(app).post('/api/auth/registro').send({
      nome: 'Usuário Temporário', email: 'temporario.api@teste.local', senha: PASSWORD
    }).expect(201);
    const logged = await login('temporario.api@teste.local');
    await request(app).delete('/api/usuarios/me').set(auth(logged.body.data.token)).expect(200);
    const removido = await Usuario.findByPk(registered.body.data.usuario.id);
    expect(removido.ativo).toBe(false);
  });
});

describe('Tabelas auxiliares', () => {
  test('lista todos os catálogos autenticados', async () => {
    for (const recurso of ['materias', 'fases', 'diligencias', 'locais-tramitacao']) {
      const response = await request(app).get(`/api/tabelas-auxiliares/${recurso}`)
        .set(auth(alunoToken)).expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    }
  });

  test('restringe mutações a Admin e permite criar/excluir', async () => {
    await request(app).post('/api/tabelas-auxiliares/materias').set(auth(professorToken))
      .send({ nome: 'Matéria Proibida' }).expect(403);
    const created = await request(app).post('/api/tabelas-auxiliares/materias').set(auth(adminToken))
      .send({ nome: 'Matéria de Teste API' }).expect(201);
    materiaId = created.body.data.id;
    await request(app).delete(`/api/tabelas-auxiliares/materias/${materiaId}`)
      .set(auth(adminToken)).expect(200);
  });

  test.each([
    ['fases', 'Fase de Teste API'],
    ['diligencias', 'Diligência de Teste API'],
    ['locais-tramitacao', 'Local de Teste API']
  ])('executa criação e exclusão administrativa em %s', async (recurso, nome) => {
    const created = await request(app).post(`/api/tabelas-auxiliares/${recurso}`)
      .set(auth(adminToken)).send({ nome }).expect(201);
    expect(created.body.data.nome).toBe(nome);
    await request(app).delete(`/api/tabelas-auxiliares/${recurso}/${created.body.data.id}`)
      .set(auth(adminToken)).expect(200);
  });

  test('rejeita nomes vazios e IDs inválidos nos catálogos', async () => {
    await request(app).post('/api/tabelas-auxiliares/fases').set(auth(adminToken))
      .send({ nome: '' }).expect(400);
    await request(app).delete('/api/tabelas-auxiliares/fases/abc')
      .set(auth(adminToken)).expect(404);
  });
});

describe('Processos, vínculos e histórico', () => {
  test('valida payload e permissão de criação', async () => {
    await request(app).post('/api/processos').set(auth(adminToken)).send({ titulo: 'Inválido' }).expect(400);
    await request(app).post('/api/processos').set(auth(alunoToken)).send({
      numero_processo: '12345-1', titulo: 'Processo aluno', contato_assistido: 'aluno@teste.local'
    }).expect(403);
  });

  test('cria, lista, consulta e edita processo', async () => {
    const created = await request(app).post('/api/processos').set(auth(adminToken)).send({
      numero_processo: '00001-2026',
      titulo: 'Processo de Integração',
      assistido: 'Pessoa Assistida',
      contato_assistido: '65999999999',
      descricao: 'Processo criado pela suíte de API'
    }).expect(201);
    processoId = created.body.data.id;

    await request(app).get('/api/processos').set(auth(adminToken)).expect(200);
    await request(app).get('/api/processos/usuario').set(auth(adminToken)).expect(200);
    await request(app).get(`/api/processos/${processoId}`).set(auth(adminToken)).expect(200);
    await request(app).get(`/api/processos/${processoId}/detalhes`).set(auth(adminToken)).expect(200);
    const updated = await request(app).put(`/api/processos/${processoId}`).set(auth(adminToken))
      .send({ titulo: 'Processo de Integração Editado', contato_assistido: 'contato@teste.local' }).expect(200);
    expect(updated.body.data.titulo).toBe('Processo de Integração Editado');
  });

  test('vincula e desvincula usuário, respeitando validações', async () => {
    const payload = { processo_id: processoId, usuario_id: aluno.id, role: 'Aluno' };
    await request(app).post(`/api/processos/${processoId}/vincular-usuario`)
      .set(auth(adminToken)).send(payload).expect(201);
    const usuarios = await request(app).get(`/api/processos/${processoId}/usuarios`)
      .set(auth(adminToken)).expect(200);
    expect(usuarios.body.data.some((item) => Number(item.id) === Number(aluno.id))).toBe(true);
    await request(app).get(`/api/processos/${processoId}`).set(auth(alunoToken)).expect(200);
    await request(app).get(`/api/processos/${processoId}/detalhes`).set(auth(alunoToken)).expect(200);
    await request(app).post(`/api/processos/${processoId}/vincular-usuario`)
      .set(auth(adminToken)).send(payload).expect(409);
    await request(app).delete(`/api/processos/${processoId}/desvincular-usuario`)
      .set(auth(adminToken)).send({ usuario_id: aluno.id }).expect(200);
    await request(app).get(`/api/processos/${processoId}`).set(auth(alunoToken)).expect(403);
  });

  test('valida filtros, IDs e duplicidade de processo', async () => {
    await request(app).get('/api/processos?porPagina=0').set(auth(adminToken)).expect(400);
    await request(app).get('/api/processos/abc').set(auth(adminToken)).expect(400);
    await request(app).post('/api/processos').set(auth(adminToken)).send({
      numero_processo: '00001-2026',
      titulo: 'Processo duplicado',
      contato_assistido: 'duplicado@teste.local'
    }).expect(409);
  });

  test('lista e consulta registros do histórico', async () => {
    const list = await request(app).get(`/api/atualizacoes?processo_id=${processoId}`)
      .set(auth(adminToken)).expect(200);
    expect(list.body.data.length).toBeGreaterThan(0);
    atualizacaoId = list.body.data[0].id;
    const detail = await request(app).get(`/api/atualizacoes/${atualizacaoId}`).set(auth(adminToken)).expect(200);
    expect(detail.body.data.processo_id).toBe(processoId);
  });

  test('cria, edita e exclui uma atualização manual com campos canônicos', async () => {
    await request(app).post('/api/atualizacoes').set(auth(alunoToken)).send({
      processo_id: processoId,
      tipo_atualizacao: 'Observação',
      descricao: 'Tentativa sem vínculo'
    }).expect(403);

    const created = await request(app).post('/api/atualizacoes').set(auth(adminToken)).send({
      processo_id: processoId,
      tipo_atualizacao: 'Observação',
      descricao: 'Atualização manual da suíte'
    }).expect(201);
    const id = created.body.data.id;
    expect(created.body.data).toMatchObject({
      processo_id: processoId,
      usuario_id: admin.id,
      tipo_atualizacao: 'Observação'
    });

    const updated = await request(app).put(`/api/atualizacoes/${id}`).set(auth(professorToken)).send({
      descricao: 'Atualização manual editada'
    }).expect(200);
    expect(updated.body.data.descricao).toBe('Atualização manual editada');
    await request(app).delete(`/api/atualizacoes/${id}`).set(auth(professorToken)).expect(200);
  });

  test('valida payload, IDs e permissões das atualizações', async () => {
    await request(app).post('/api/atualizacoes').set(auth(adminToken)).send({
      processo_id: processoId,
      descricao: 'Sem tipo'
    }).expect(400);
    await request(app).get('/api/atualizacoes/abc').set(auth(adminToken)).expect(400);
    await request(app).get('/api/atualizacoes/999999').set(auth(adminToken)).expect(404);
    await request(app).put(`/api/atualizacoes/${atualizacaoId}`).set(auth(alunoToken))
      .send({ descricao: 'Alteração indevida' }).expect(403);
    await request(app).delete(`/api/atualizacoes/${atualizacaoId}`).set(auth(alunoToken)).expect(403);
  });

  test('conclui, bloqueia alteração e reabre processo', async () => {
    await request(app).put(`/api/processos/${processoId}/concluir`).set(auth(adminToken)).expect(200);
    await request(app).put(`/api/processos/${processoId}`).set(auth(adminToken))
      .send({ titulo: 'Não deve alterar' }).expect(403);
    await request(app).post('/api/atualizacoes').set(auth(adminToken)).send({
      processo_id: processoId,
      tipo_atualizacao: 'Observação',
      descricao: 'Não deve ser criada'
    }).expect(403);
    await request(app).put(`/api/processos/${processoId}/reabrir`).set(auth(adminToken)).expect(200);
  });
});

describe('Arquivos', () => {
  test('exige arquivo no upload', async () => {
    await request(app).post('/api/arquivos/upload').set(auth(adminToken)).expect(400);
  });

  test('faz upload, lista, consulta e baixa arquivo vinculado ao processo', async () => {
    const uploaded = await request(app).post('/api/arquivos/upload').set(auth(adminToken))
      .field('processo_id', String(processoId))
      .field('nome', 'Documento da API')
      .attach('arquivo', Buffer.from('conteúdo do teste de integração'), 'teste-api.txt')
      .expect(201);
    arquivoId = uploaded.body.data.id;

    const list = await request(app).get(`/api/arquivos?processo_id=${processoId}`)
      .set(auth(adminToken)).expect(200);
    expect(list.body.data[0].processo.id).toBe(processoId);
    await request(app).get(`/api/arquivos/${arquivoId}`).set(auth(adminToken)).expect(200);
    const download = await request(app).get(`/api/arquivos/${arquivoId}/download`)
      .set(auth(adminToken)).expect(200);
    expect(download.headers['content-disposition']).toContain('attachment');
  });

  test('impede aluno sem vínculo de anexar ou listar arquivos do processo', async () => {
    await request(app).post('/api/arquivos/upload').set(auth(alunoToken))
      .field('processo_id', String(processoId))
      .attach('arquivo', Buffer.from('conteúdo não autorizado'), 'nao-autorizado.txt')
      .expect(403);
    await request(app).get(`/api/arquivos?processo_id=${processoId}`)
      .set(auth(alunoToken)).expect(403);
  });

  test('aplica permissão e soft delete', async () => {
    await request(app).get(`/api/arquivos/${arquivoId}`).set(auth(alunoToken)).expect(403);
    await request(app).get(`/api/arquivos/usuario/${admin.id}`).set(auth(adminToken)).expect(200);
    await request(app).delete(`/api/arquivos/${arquivoId}`).set(auth(adminToken)).expect(200);
  });

  test('valida arquivos inexistentes e formatos não permitidos', async () => {
    await request(app).get('/api/arquivos/999999').set(auth(adminToken)).expect(404);
    await request(app).get('/api/arquivos/999999/download').set(auth(adminToken)).expect(404);
    await request(app).post('/api/arquivos/upload').set(auth(adminToken))
      .field('processo_id', String(processoId))
      .attach('arquivo', Buffer.from('binário inválido'), {
        filename: 'programa.exe',
        contentType: 'application/octet-stream'
      })
      .expect(400);
  });
});

describe('Agendamentos', () => {
  test('valida dados obrigatórios', async () => {
    await request(app).post('/api/agendamentos').set(auth(adminToken))
      .send({ titulo: 'x' }).expect(400);
  });

  test('cria agendamento ligado ao processo e registra histórico', async () => {
    const inicio = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
    const created = await request(app).post('/api/agendamentos').set(auth(adminToken)).send({
      processo_id: processoId,
      titulo: 'Audiência de Integração',
      descricao: 'Agendamento criado pela suíte',
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      local: 'Sala de testes',
      tipo: 'audiencia',
      convidados: []
    }).expect(201);
    agendamentoId = created.body.data.id;
    expect(created.body.data.status).toBe('marcado');

    const historico = await request(app).get(`/api/atualizacoes?processo_id=${processoId}`)
      .set(auth(adminToken)).expect(200);
    expect(historico.body.data.some((item) => item.tipo_atualizacao === 'Criação de Agendamento')).toBe(true);
  });

  test('lista, filtra, consulta e edita agendamento', async () => {
    const list = await request(app).get('/api/agendamentos?status=todos&page=1&limit=10')
      .set(auth(adminToken)).expect(200);
    expect(list.body.data.some((item) => item.id === agendamentoId)).toBe(true);
    await request(app).get('/api/agendamentos/filtros').set(auth(adminToken)).expect(200);
    await request(app).get('/api/agendamentos/stats').set(auth(adminToken)).expect(200);
    await request(app).get('/api/agendamentos/stats/convites').set(auth(adminToken)).expect(200);
    await request(app).get(`/api/agendamentos/${agendamentoId}`).set(auth(adminToken)).expect(200);
    await request(app).get(`/api/agendamentos/processo/${processoId}`).set(auth(adminToken)).expect(200);
    const updated = await request(app).put(`/api/agendamentos/${agendamentoId}`).set(auth(adminToken))
      .send({ titulo: 'Audiência de Integração Editada' }).expect(200);
    expect(updated.body.data.titulo).toBe('Audiência de Integração Editada');
  });

  test('valida filtros, IDs e permissões de alteração', async () => {
    await request(app).get('/api/agendamentos?page=0').set(auth(adminToken)).expect(400);
    await request(app).get('/api/agendamentos?status=invalido').set(auth(adminToken)).expect(400);
    await request(app).get('/api/agendamentos/999999').set(auth(adminToken)).expect(404);
    await request(app).get(`/api/agendamentos/${agendamentoId}`).set(auth(alunoToken)).expect(403);
    await request(app).put(`/api/agendamentos/${agendamentoId}`).set(auth(professorToken))
      .send({ titulo: 'Alteração indevida' }).expect(403);
    await request(app).delete(`/api/agendamentos/${agendamentoId}`).set(auth(alunoToken)).expect(403);
    await request(app).post('/api/agendamentos/verificar-status').set(auth(alunoToken)).expect(403);
    await request(app).patch(`/api/agendamentos/${agendamentoId}/status`).set(auth(alunoToken))
      .send({ status: 'finalizado' }).expect(403);
    await request(app).get('/api/agendamentos/lembrete/pendentes').set(auth(alunoToken)).expect(403);
    await request(app).get('/api/agendamentos/lembrete/pendentes').set(auth(adminToken)).expect(200);
  });

  test('permite alteração administrativa de status com contrato consistente', async () => {
    const changed = await request(app).patch(`/api/agendamentos/${agendamentoId}/status`)
      .set(auth(adminToken)).send({ status: 'finalizado' }).expect(200);
    expect(changed.body).toMatchObject({
      success: true,
      data: { id: agendamentoId, status: 'finalizado' }
    });

    await request(app).patch(`/api/agendamentos/${agendamentoId}/status`)
      .set(auth(adminToken)).send({ status: 'marcado' }).expect(200);
    await request(app).patch(`/api/agendamentos/${agendamentoId}/status`)
      .set(auth(adminToken)).send({ status: 'desconhecido' }).expect(400);
  });

  test('impede aluno sem vínculo de criar ou consultar agendamentos do processo', async () => {
    const inicio = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 60 * 60 * 1000);
    await request(app).post('/api/agendamentos').set(auth(alunoToken)).send({
      processo_id: processoId,
      titulo: 'Agendamento não autorizado',
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      tipo: 'reuniao'
    }).expect(403);
    await request(app).get(`/api/agendamentos/processo/${processoId}`)
      .set(auth(alunoToken)).expect(403);
    await request(app).get(`/api/agendamentos?processo_id=${processoId}`)
      .set(auth(alunoToken)).expect(403);
  });

  test('cancela um agendamento com motivo e preserva o registro', async () => {
    const inicio = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 30 * 60 * 1000);
    const created = await request(app).post('/api/agendamentos').set(auth(adminToken)).send({
      titulo: 'Agendamento para cancelamento',
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      local: 'Sala de testes',
      tipo: 'reuniao',
      convidados: []
    }).expect(201);
    const id = created.body.data.id;

    const canceled = await request(app).post(`/api/agendamentos/${id}/cancelar`)
      .set(auth(adminToken)).send({ motivo: 'Cancelamento exercitado pela suíte' }).expect(200);
    expect(canceled.body.data).toMatchObject({
      id,
      status: 'cancelado',
      motivo_cancelamento: 'Cancelamento exercitado pela suíte'
    });
    await request(app).get(`/api/agendamentos/${id}`).set(auth(adminToken)).expect(200);
    await request(app).delete(`/api/agendamentos/${id}`).set(auth(adminToken)).expect(200);
  });

  test('expõe a visualização pública do convite com contrato seguro', async () => {
    const response = await request(app).get(`/api/convite/${agendamentoId}`).expect(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        id: agendamentoId,
        titulo: 'Audiência de Integração Editada',
        convidados: []
      }
    });
    expect(response.body.data).not.toHaveProperty('email_lembrete');
  });

  test('processa aceite e recusa de convidados públicos de ponta a ponta', async () => {
    const inicio = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 45 * 60 * 1000);
    const emailAceite = 'aceite.publico@teste.local';
    const emailRecusa = 'recusa.publica@teste.local';
    const created = await request(app).post('/api/agendamentos').set(auth(adminToken)).send({
      processo_id: processoId,
      titulo: 'Agendamento com respostas públicas',
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      tipo: 'reuniao',
      convidados: [
        { nome: 'Convidado Aceite', email: emailAceite },
        { nome: 'Convidado Recusa', email: emailRecusa }
      ]
    }).expect(201);
    const id = created.body.data.id;

    const visualizacao = await request(app).get(`/api/convite/${id}?email=${emailAceite}`).expect(200);
    expect(visualizacao.body.data.convidados).toHaveLength(1);
    expect(visualizacao.body.data.convidados[0].email).toBe(emailAceite);
    await request(app).get(`/api/convite/${id}?email=inexistente@teste.local`).expect(404);

    const accepted = await request(app).post(`/api/agendamentos/${id}/aceitar-publico`)
      .send({ email: emailAceite }).expect(200);
    expect(accepted.body.data.status).toBe('aceito');

    const refused = await request(app).post(`/api/convite/${id}/recusar`)
      .send({ email: emailRecusa, justificativa: 'Não poderei comparecer ao compromisso.' }).expect(200);
    expect(refused.body.data.status).toBe('recusado');

    const detail = await request(app).get(`/api/agendamentos/${id}`).set(auth(adminToken)).expect(200);
    expect(detail.body.data.convidados).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: emailAceite, status: 'aceito' }),
      expect.objectContaining({ email: emailRecusa, status: 'recusado' })
    ]));
    await request(app).delete(`/api/agendamentos/${id}`).set(auth(adminToken)).expect(200);
  });

  test('processa respostas autenticadas somente para o email do usuário', async () => {
    const inicio = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 30 * 60 * 1000);
    const created = await request(app).post('/api/agendamentos').set(auth(adminToken)).send({
      titulo: 'Convite autenticado',
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      tipo: 'reuniao',
      convidados: [{ nome: aluno.nome, email: aluno.email }]
    }).expect(201);
    const id = created.body.data.id;

    const accepted = await request(app).post(`/api/agendamentos/${id}/aceitar`)
      .set(auth(alunoToken)).send({}).expect(200);
    expect(accepted.body.data.convidados).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: aluno.email, status: 'aceito' })
    ]));

    await request(app).post(`/api/agendamentos/${id}/recusar`)
      .set(auth(alunoToken)).send({ email: professor.email }).expect(403);
    await request(app).delete(`/api/agendamentos/${id}`).set(auth(adminToken)).expect(200);
  });

  test('restringe decisões administrativas e valida convites públicos', async () => {
    await request(app).post(`/api/agendamentos/${agendamentoId}/aprovar`)
      .set(auth(alunoToken)).send({}).expect(403);
    await request(app).post(`/api/agendamentos/${agendamentoId}/aceitar-publico`)
      .send({ email: 'email-invalido' }).expect(400);
    await request(app).post(`/api/convite/${agendamentoId}/recusar`)
      .send({ email: 'email-invalido' }).expect(400);
  });

  test('remove agendamento', async () => {
    await request(app).delete(`/api/agendamentos/${agendamentoId}`).set(auth(adminToken)).expect(200);
    await request(app).get(`/api/agendamentos/${agendamentoId}`).set(auth(adminToken)).expect(404);
  });
});

describe('Dashboard e encerramento do fluxo', () => {
  test('consulta todas as visões do dashboard', async () => {
    for (const rota of ['', '/stats', '/status-detalhado']) {
      await request(app).get(`/api/dashboard${rota}`).set(auth(adminToken)).expect(200);
    }
  });

  test('exclui processo e confirma 404', async () => {
    await request(app).delete(`/api/processos/${processoId}`).set(auth(adminToken)).expect(200);
    await request(app).get(`/api/processos/${processoId}`).set(auth(adminToken)).expect(404);
  });
});
