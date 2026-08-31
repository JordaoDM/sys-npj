const errorHandler = (err, req, res, next) => {
  console.error(' Erro capturado pelo middleware:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    ip: req.ip,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });

  let statusCode = err.status || err.statusCode || 500;
  let message = err.message || 'Erro interno do servidor';

  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Erro de validação de dados';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Violação de restrição única - dados duplicados';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Erro de referência - dados relacionados não encontrados';
  } else if (err.name === 'MulterError' || err.message === 'Tipo de arquivo não permitido') {
    statusCode = 400;
    message = err.message;
  }

  res.status(statusCode).json({
    erro: message,
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

module.exports = errorHandler;
