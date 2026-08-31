const LEVEL_PRIORITY = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40 });
const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /pass|senha|secret|token|authorization|cookie|credential|api[_-]?key/i;
const EMAIL_PATTERN = /([\w.+-]{1,3})[\w.+-]*@([\w-]+(?:\.[\w-]+)+)/g;
const BEARER_PATTERN = /Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi;
const JWT_PATTERN = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function sanitizeString(value) {
  return value
    .replace(BEARER_PATTERN, `Bearer ${REDACTED}`)
    .replace(JWT_PATTERN, REDACTED)
    .replace(EMAIL_PATTERN, '$1***@$2');
}

function sanitize(value, seen = new WeakSet()) {
  if (typeof value === 'string') return sanitizeString(value);
  if (value === null || value === undefined || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';
  seen.add(value);

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message || 'Erro sem mensagem'),
      code: value.code
    };
  }

  if (Array.isArray(value)) return value.map(item => sanitize(item, seen));

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : sanitize(item, seen)
    ])
  );
}

function configureProductionLogging() {
  if (process.env.NODE_ENV !== 'production') return;

  const configuredLevel = String(process.env.LOG_LEVEL || 'info').toLowerCase();
  const minimumPriority = LEVEL_PRIORITY[configuredLevel] || LEVEL_PRIORITY.info;
  const output = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console)
  };

  const write = (level, args) => {
    if (LEVEL_PRIORITY[level] < minimumPriority) return;
    const [first, ...rest] = args;
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: sanitizeString(typeof first === 'string' ? first : 'Evento da aplicação')
    };
    if (typeof first !== 'string') rest.unshift(first);
    if (rest.length) entry.context = sanitize(rest.length === 1 ? rest[0] : rest);
    output[level === 'debug' ? 'log' : level](JSON.stringify(entry));
  };

  console.debug = (...args) => write('debug', args);
  console.log = (...args) => write('info', args);
  console.info = (...args) => write('info', args);
  console.warn = (...args) => write('warn', args);
  console.error = (...args) => write('error', args);
}

module.exports = { configureProductionLogging, sanitize };
