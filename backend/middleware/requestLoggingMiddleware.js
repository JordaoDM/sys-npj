const { randomUUID } = require('crypto');

module.exports = function requestLoggingMiddleware(req, res, next) {
  const requestId = req.get('x-request-id') || randomUUID();
  const startedAt = process.hrtime.bigint();

  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);

  if (process.env.NODE_ENV === 'production') res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const log = res.statusCode >= 500 ? console.error : res.statusCode >= 400 ? console.warn : console.info;
    log('Requisição HTTP concluída', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      userId: req.user?.id || null
    });
  });

  next();
};
