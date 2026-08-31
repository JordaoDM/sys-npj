class RequestCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.pendingRequests = new Map();

    this.cacheConfig = {
      "/api/usuarios/me": { ttl: 5 * 60 * 1000, priority: "high" },
      "/api/processos": { ttl: 2 * 60 * 1000, priority: "medium" },
      "/api/usuarios": { ttl: 3 * 60 * 1000, priority: "medium" },
      "/api/aux/": { ttl: 30 * 60 * 1000, priority: "low" },
      "/api/agendamentos": { ttl: 1 * 60 * 1000, priority: "high" },
      "/api/atualizacoes": { ttl: 30 * 1000, priority: "high" },
    };

    setInterval(() => this.cleanupCache(), 60 * 1000);
  }

  generateKey(url, options = {}) {
    const { method = "GET", body, token } = options;
    const baseKey = `${method}:${url}`;

    if (body) {
      return `${baseKey}:${JSON.stringify(body)}`;
    }

    return baseKey;
  }

  getTTL(url) {
    for (const [pattern, config] of Object.entries(this.cacheConfig)) {
      if (url.includes(pattern)) {
        return config.ttl;
      }
    }
    return 2 * 60 * 1000;
  }

  isValid(key) {
    if (!this.cache.has(key)) return false;

    const timestamp = this.timestamps.get(key);
    const ttl = this.getTTL(key);

    return Date.now() - timestamp < ttl;
  }

  get(key) {
    if (this.isValid(key)) {
      return this.cache.get(key);
    }
    return null;
  }

  set(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());

    if (this.cache.size > 200) {
      this.cleanupCache();
    }
  }

  invalidate(pattern) {
    const keysToDelete = [];

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });
  }

  cleanupCache() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, timestamp] of this.timestamps.entries()) {
      const ttl = this.getTTL(key);
      if (now - timestamp > ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      this.cache.delete(key);
      this.timestamps.delete(key);
    });

  }

  async getOrFetch(key, fetchFunction) {
    const cachedData = this.get(key);
    if (cachedData) {
      return cachedData;
    }

    if (this.pendingRequests.has(key)) {
      return await this.pendingRequests.get(key);
    }

    const request = fetchFunction().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);

    try {
      const data = await request;
      this.set(key, data);
      return data;
    } catch (error) {
      throw error;
    }
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.pendingRequests.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()).slice(0, 10),
      oldestEntry: Math.min(...Array.from(this.timestamps.values())),
      newestEntry: Math.max(...Array.from(this.timestamps.values())),
    };
  }
}

export const requestCache = new RequestCache();
