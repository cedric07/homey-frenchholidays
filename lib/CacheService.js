'use strict';

class CacheService {

  constructor(settings) {
    this.settings = settings;
  }

  _cacheKey(type, key) {
    return `cache:${type}:${key}`;
  }

  get(type, key) {
    const entry = this.settings.get(this._cacheKey(type, key));
    if (!entry || typeof entry !== 'object') return null;
    return entry;
  }

  set(type, key, data, ttlMs) {
    this.settings.set(this._cacheKey(type, key), {
      data,
      fetchedAt: Date.now(),
      ttlMs,
    });
  }

  getValid(type, key) {
    const entry = this.get(type, key);
    if (!entry) return null;
    if (Date.now() - entry.fetchedAt > entry.ttlMs) return null;
    return entry.data;
  }

  getStale(type, key) {
    const entry = this.get(type, key);
    return entry ? entry.data : null;
  }

  invalidate(type, key) {
    const cacheKey = this._cacheKey(type, key);
    if (typeof this.settings.unset === 'function') {
      this.settings.unset(cacheKey);
    } else {
      this.settings.set(cacheKey, null);
    }
  }

}

module.exports = CacheService;
