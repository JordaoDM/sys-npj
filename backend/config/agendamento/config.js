
const CRON_SCHEDULES = {
  LEMBRETES_DIARIOS: '0 8 * * *',
  
  LEMBRETES_1H_ANTES: '0 * * * *',
  
  VERIFICACAO_STATUS: '*/30 * * * *',
  
  LIMPEZA_LOGS: '0 2 * * 0'
};

const EMAIL_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 5000,
  
  MAX_EMAILS_PER_MINUTE: 30,
  
  TEMPLATE_DIR: 'templates/email',
  DEFAULT_FROM_NAME: 'Sistema NPJ - Agendamentos'
};

const CACHE_CONFIG = {
  AGENDAMENTOS_LIST_TTL: 300,
  USUARIO_PERMISSIONS_TTL: 600,
  PROCESSO_INFO_TTL: 1800,
  
  CACHE_PREFIXES: {
    AGENDAMENTO: 'agendamento:',
    USUARIO: 'usuario:',
    PROCESSO: 'processo:',
    STATS: 'stats:'
  }
};

const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 12,
  MAX_PAGE_SIZE: 100,
  MIN_PAGE_SIZE: 1
};

const VALIDATION_CONFIG = {
  TITULO_MIN_LENGTH: 3,
  TITULO_MAX_LENGTH: 255,
  DESCRICAO_MAX_LENGTH: 1000,
  LOCAL_MAX_LENGTH: 500,
  OBSERVACOES_MAX_LENGTH: 1000,
  MOTIVO_RECUSA_MIN_LENGTH: 10,
  MOTIVO_RECUSA_MAX_LENGTH: 500,
  NOME_CONVIDADO_MAX_LENGTH: 100
};

const LOG_CONFIG = {
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn', 
    INFO: 'info',
    DEBUG: 'debug'
  },
  
  FILES: {
    ERROR: 'logs/agendamento-errors.log',
    COMBINED: 'logs/agendamento-combined.log',
    AUDIT: 'logs/agendamento-audit.log'
  }
};

module.exports = {
  CRON_SCHEDULES,
  EMAIL_CONFIG,
  CACHE_CONFIG,
  PAGINATION_CONFIG,
  VALIDATION_CONFIG,
  LOG_CONFIG
};
