
const cache = new Map();

function set(key, value, ttlMs = 5 * 60 * 1000) {
  const expires = Date.now() + ttlMs;
  cache.set(key, { value, expires });
}

function get(key) {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function del(key) {
  cache.delete(key);
}

function keys() {
  return Array.from(cache.keys());
}

module.exports = { set, get, delete: del, keys };
