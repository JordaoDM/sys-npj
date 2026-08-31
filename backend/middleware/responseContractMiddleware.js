function responseContract(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (payload && typeof payload === 'object' && typeof payload.success === 'boolean') {
      if (!payload.success) {
        return originalJson({
          success: false,
          message: payload.message || payload.erro || payload.error || 'Erro na requisição',
          ...(payload.errors ? { errors: payload.errors } : {})
        });
      }
      if (Object.prototype.hasOwnProperty.call(payload, 'processo') && !Object.prototype.hasOwnProperty.call(payload, 'data')) {
        const { processo, mensagem, ...rest } = payload;
        return originalJson({ ...rest, data: processo, ...(mensagem ? { message: mensagem } : {}) });
      }
      if (!Object.prototype.hasOwnProperty.call(payload, 'data')) {
        const { success, message, mensagem, ...data } = payload;
        return originalJson({
          success,
          ...((message || mensagem) ? { message: message || mensagem } : {}),
          ...(Object.keys(data).length ? { data } : {})
        });
      }
      return originalJson(payload);
    }

    const failed = res.statusCode >= 400;
    if (failed) {
      const source = payload && typeof payload === 'object' ? payload : {};
      const normalized = {
        success: false,
        message: source.message || source.erro || source.error || String(payload || 'Erro na requisição')
      };
      if (source.errors) normalized.errors = source.errors;
      if (source.detalhes) normalized.details = source.detalhes;
      return originalJson(normalized);
    }

    if (Array.isArray(payload)) return originalJson({ success: true, data: payload });

    const serializablePayload = payload && typeof payload.toJSON === 'function' ? payload.toJSON() : payload;
    const source = serializablePayload && typeof serializablePayload === 'object'
      ? { ...serializablePayload }
      : { data: serializablePayload };
    const message = source.message || source.mensagem;
    delete source.message;
    delete source.mensagem;

    if (Object.prototype.hasOwnProperty.call(source, 'processo') && !Object.prototype.hasOwnProperty.call(source, 'data')) {
      source.data = source.processo;
      delete source.processo;
    }

    if (Object.prototype.hasOwnProperty.call(source, 'data')) {
      return originalJson({ success: true, ...(message ? { message } : {}), ...source });
    }

    const keys = Object.keys(source);
    if (keys.length === 0) return originalJson({ success: true, ...(message ? { message } : {}) });
    return originalJson({ success: true, ...(message ? { message } : {}), data: source });
  };

  next();
}

module.exports = responseContract;
