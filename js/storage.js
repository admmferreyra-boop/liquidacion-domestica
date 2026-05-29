/* Liquidación Doméstica — storage.js
   LocalStorage wrapper con namespace, versionado de schema y error handling */

var LD = window.LD || {};

LD.Storage = (function () {
  'use strict';

  var NAMESPACE = 'liquidacion-domestica:';
  var SCHEMA_VERSION = 1;

  function prefixed(key) {
    if (!key || typeof key !== 'string') {
      throw new TypeError('[Storage] Key debe ser un string no vacío');
    }
    return NAMESPACE + key;
  }

  function save(key, data, onError) {
    try {
      var payload = JSON.stringify({
        version: SCHEMA_VERSION,
        data: data,
        savedAt: new Date().toISOString()
      });
      localStorage.setItem(prefixed(key), payload);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        console.warn('[Storage] QuotaExceededError al guardar "' + key + '". Estado preservado.');
      } else {
        console.warn('[Storage] Error al guardar "' + key + '":', e.message);
      }
      if (typeof onError === 'function') {
        onError(e);
      }
      return false;
    }
  }

  function load(key, defaults) {
    try {
      var raw = localStorage.getItem(prefixed(key));
      if (raw === null) {
        return defaults !== undefined ? defaults : null;
      }
      var parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== SCHEMA_VERSION) {
        console.warn(
          '[Storage] Version mismatch para "' + key + '": esperada ' +
          SCHEMA_VERSION + ', recibida ' + (parsed ? parsed.version : 'N/A') +
          '. Usando default.'
        );
        return defaults !== undefined ? defaults : null;
      }
      return parsed.data;
    } catch (e) {
      console.warn('[Storage] Error al cargar "' + key + '":', e.message);
      return defaults !== undefined ? defaults : null;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(prefixed(key));
    } catch (e) {
      console.warn('[Storage] Error al remover "' + key + '":', e.message);
    }
  }

  function exportAll() {
    var result = {};
    var prefixLen = NAMESPACE.length;
    for (var i = 0; i < localStorage.length; i++) {
      var rawKey = localStorage.key(i);
      if (rawKey && rawKey.indexOf(NAMESPACE) === 0) {
        var shortKey = rawKey.substring(prefixLen);
        try {
          result[shortKey] = JSON.parse(localStorage.getItem(rawKey));
        } catch (e) {
          result[shortKey] = { error: 'Corrupted data', raw: localStorage.getItem(rawKey) };
        }
      }
    }
    result._exportedAt = new Date().toISOString();
    return result;
  }

  function importAll(data, onError) {
    if (!data || typeof data !== 'object') {
      if (typeof onError === 'function') {
        onError(new Error('[Storage] Datos de importación inválidos'));
      }
      return 0;
    }
    var count = 0;
    for (var key in data) {
      if (key === '_exportedAt') continue;
      if (!data.hasOwnProperty(key)) continue;
      try {
        localStorage.setItem(
          prefixed(key),
          typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key])
        );
        count++;
      } catch (e) {
        if (typeof onError === 'function') onError(e);
      }
    }
    return count;
  }

  return {
    save: save,
    load: load,
    remove: remove,
    exportAll: exportAll,
    importAll: importAll,
    SCHEMA_VERSION: SCHEMA_VERSION
  };
})();
