const SYSTEM_CONFIG = {
  SERVER: {
    DEFAULT_PORT: 3001,
    VERSION: '1.0.0',
    NAME: 'Sistema NPJ'
  },

  DATABASE: {
    DEFAULT_HOST: 'localhost',
    DEFAULT_PORT: 3306,
    DEFAULT_USER: 'root',
    DIALECT: 'mysql'
  },

  JWT: {
    DEFAULT_EXPIRES_IN: '24h',
    REFRESH_EXPIRES_IN: '7d'
  },

  UPLOAD: {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    ALLOWED_TYPES: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
    UPLOAD_PATH: 'uploads/'
  },

  NOTIFICATIONS: {
    POLL_INTERVAL: 30000,
    MAX_NOTIFICATIONS: 50
  },

  PROCESS_STATUS: {
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    SUSPENSO: 'Suspenso',
    ARQUIVADO: 'Arquivado'
  },

  EVENT_TYPES: {
    AUDIENCIA: 'audiencia',
    PRAZO: 'prazo',
    REUNIAO: 'reuniao',
    DILIGENCIA: 'diligencia',
    OUTRO: 'outro'
  },

  NOTIFICATION_TYPES: {
    LEMBRETE: 'lembrete',
    ALERTA: 'alerta',
    INFORMACAO: 'informacao',
    SISTEMA: 'sistema'
  },

  NOTIFICATION_STATUS: {
    PENDENTE: 'pendente',
    ENVIADO: 'enviado',
    LIDO: 'lido',
    ERRO: 'erro'
  },

  USER_ROLES: {
    ADMIN: { id: 1, nome: 'Admin' },
    PROFESSOR: { id: 2, nome: 'Professor' },
    ALUNO: { id: 3, nome: 'Aluno' }
  },

  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Usuário não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    VALIDATION_ERROR: 'Erro de validação',
    DUPLICATE_ENTRY: 'Dados duplicados',
    SERVER_ERROR: 'Erro interno do servidor',
    DATABASE_ERROR: 'Erro de banco de dados'
  },

  SUCCESS_MESSAGES: {
    CREATED: 'Criado com sucesso',
    UPDATED: 'Atualizado com sucesso',
    DELETED: 'Removido com sucesso',
    LOGGED_IN: 'Login realizado com sucesso',
    LOGGED_OUT: 'Logout realizado com sucesso'
  }
};

module.exports = SYSTEM_CONFIG;
