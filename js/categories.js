/* Liquidación Doméstica — categories.js
   Datos AFIP: tabla default embedida, CRUD, validación, import/export JSON
   Cuando se sirve desde GitHub Pages, busca automáticamente la última escala en data/afip-defaults.json */

var LD = window.LD || {};

LD.Categories = (function () {
  'use strict';

  /* URL de la escala publicada (relativa — funciona en GitHub Pages)
     Se puede cambiar a una URL absoluta si se aloja en otro lado */
  var DATA_URL = 'data/afip-defaults.json';

  /* Escala ARCA — valores oficiales embebidos como fallback offline
     Septiembre 2026: Res. CNTCP 6/2026 (BO 03/09/2026), PDF oficial ARCA */
  var CATEGORIAS_AFIP = [
    {
      id: 1,
      nombre: 'Supervisor/a',
      descripcion: 'Coordinación y control de tareas',
      modalidades: {
        con_retiro: { valor_hora: 4645.33, valor_mensual: 579493.14 },
        sin_retiro: { valor_hora: 5049.58, valor_mensual: 640641.55 }
      }
    },
    {
      id: 2,
      nombre: 'Tareas específicas',
      descripcion: 'Personal con tareas específicas',
      modalidades: {
        con_retiro: { valor_hora: 4422.54, valor_mensual: 541402.49 },
        sin_retiro: { valor_hora: 4809.80, valor_mensual: 597854.36 }
      }
    },
    {
      id: 3,
      nombre: 'Caseros/as',
      descripcion: 'Personal para tareas de casería',
      modalidades: {
        sin_retiro: { valor_hora: 4185.94, valor_mensual: 529261.78 }
      }
    },
    {
      id: 4,
      nombre: 'Cuidado de personas',
      descripcion: 'Asistencia y cuidados de personas',
      modalidades: {
        con_retiro: { valor_hora: 4185.94, valor_mensual: 529261.78 },
        sin_retiro: { valor_hora: 4641.90, valor_mensual: 584936.09 }
      }
    },
    {
      id: 5,
      nombre: 'Tareas generales',
      descripcion: 'Personal para tareas generales',
      modalidades: {
        con_retiro: { valor_hora: 3914.64, valor_mensual: 480247.85 },
        sin_retiro: { valor_hora: 4185.94, valor_mensual: 529261.78 }
      }
    }
  ];

  /* Escala IgnacioOnline — septiembre 2026, opción alternativa.
     Difiere de ARCA en tareas generales sin retiro (4.306,71 / 544.531,78),
     fila que no coincide con el PDF oficial de ARCA. */
  var CATEGORIAS_IGNACIO = [
    {
      id: 1,
      nombre: 'Supervisor/a',
      descripcion: 'Coordinación y control de tareas',
      modalidades: {
        con_retiro: { valor_hora: 4645.32, valor_mensual: 579493.14 },
        sin_retiro: { valor_hora: 5049.58, valor_mensual: 640641.55 }
      }
    },
    {
      id: 2,
      nombre: 'Tareas específicas',
      descripcion: 'Personal con tareas específicas',
      modalidades: {
        con_retiro: { valor_hora: 4422.53, valor_mensual: 541402.48 },
        sin_retiro: { valor_hora: 4809.80, valor_mensual: 597854.37 }
      }
    },
    {
      id: 3,
      nombre: 'Caseros/as',
      descripcion: 'Personal para tareas de casería',
      modalidades: {
        sin_retiro: { valor_hora: 4185.94, valor_mensual: 529261.78 }
      }
    },
    {
      id: 4,
      nombre: 'Cuidado de personas',
      descripcion: 'Asistencia y cuidados de personas',
      modalidades: {
        con_retiro: { valor_hora: 4185.94, valor_mensual: 529261.78 },
        sin_retiro: { valor_hora: 4641.90, valor_mensual: 584936.09 }
      }
    },
    {
      id: 5,
      nombre: 'Tareas generales',
      descripcion: 'Personal para tareas generales',
      modalidades: {
        con_retiro: { valor_hora: 3914.63, valor_mensual: 480247.84 },
        sin_retiro: { valor_hora: 4306.71, valor_mensual: 544531.78 }
      }
    }
  ];

  var FUENTES = {
    afip: { nombre: 'ARCA (oficial)', data: CATEGORIAS_AFIP },
    ignacio: { nombre: 'IgnacioOnline', data: CATEGORIAS_IGNACIO }
  };

  var categorias = null;
  var fuenteActiva = 'afip';
  var datosRemotos = null;

  /* Valores de suma no remunerativa y aumentos — se actualizan desde el JSON remoto */
  var snrBrackets = [
    { maxHoras: 12, monto: 8000 },
    { minHoras: 12, maxHoras: 16, monto: 11500 },
    { minHoras: 16, monto: 20000 }
  ];

  var aumentosProgramados = []; // Sin aumentos programados — la escala se actualiza mes a mes en data/afip-defaults.json

  function getFuenteDefault( fuente ) {
    var entry = FUENTES[fuente] || FUENTES.afip;
    return clonar( entry.data );
  }

  function cargar() {
    if (categorias !== null) return;
    fuenteActiva = 'afip';
    categorias = clonar(CATEGORIAS_AFIP);

    // Intentar descargar la última escala publicada (sin bloquear — si falla usa la embebida)
    fetchActualizacion();
  }

  function fetchActualizacion() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', DATA_URL + '?_=' + Date.now(), true); // cachebuster
    xhr.timeout = 5000; // 5 segundos de timeout

    xhr.onload = function () {
      if (xhr.status === 200) {
        try {
          var data = JSON.parse(xhr.responseText);
          if (data && Array.isArray(data.categorias) && data.categorias.length > 0) {
            datosRemotos = data;
            // Actualizar las fuentes con los datos remotos
            categorias = data.categorias;
            // Actualizar también las embebidas para que resetToDefaults use las nuevas
            actualizarDefaults(data);
          }
        } catch (e) {
          // JSON inválido — seguir con defaults
        }
      }
    };
    // Si falla (offline, timeout, etc) — se queda con los defaults embebidos
    xhr.send();
  }

  function actualizarDefaults(data) {
    CATEGORIAS_AFIP.length = 0;
    CATEGORIAS_IGNACIO.length = 0;
    for (var i = 0; i < data.categorias.length; i++) {
      CATEGORIAS_AFIP.push(JSON.parse(JSON.stringify(data.categorias[i])));
    }
    // Escala IgnacioOnline propia si el JSON la trae; si no, misma tabla que la oficial
    var tablaIgnacio = Array.isArray(data.categoriasIgnacio) && data.categoriasIgnacio.length > 0
      ? data.categoriasIgnacio
      : data.categorias;
    for (var j = 0; j < tablaIgnacio.length; j++) {
      CATEGORIAS_IGNACIO.push(JSON.parse(JSON.stringify(tablaIgnacio[j])));
    }
    if (data.sumaNoRemunerativa && Array.isArray(data.sumaNoRemunerativa.brackets)) {
      snrBrackets = data.sumaNoRemunerativa.brackets;
    }
    if (data.aumentos && Array.isArray(data.aumentos)) {
      aumentosProgramados = data.aumentos;
    }
  }

  function clonar(arr) {
    return JSON.parse(JSON.stringify(arr));
  }

  function persistir() {
    // Sin persistencia — cada sesión arranca limpia
  }

  function getAll() {
    cargar();
    return clonar(categorias);
  }

  function getById(id) {
    cargar();
    for (var i = 0; i < categorias.length; i++) {
      if (categorias[i].id === id) {
        return JSON.parse(JSON.stringify(categorias[i]));
      }
    }
    return null;
  }

  function update(id, modalidad, campo, valor) {
    cargar();
    for (var i = 0; i < categorias.length; i++) {
      if (categorias[i].id === id) {
        if (!categorias[i].modalidades[modalidad]) {
          categorias[i].modalidades[modalidad] = {};
        }
        categorias[i].modalidades[modalidad][campo] = valor;
        persistir();
        return true;
      }
    }
    return false;
  }

  function validarSchema(data) {
    if (!data || !Array.isArray(data.categorias)) {
      return { valido: false, error: 'El archivo debe contener un array "categorias"' };
    }
    if (data.categorias.length === 0) {
      return { valido: false, error: 'El array "categorias" no puede estar vacío' };
    }
    for (var i = 0; i < data.categorias.length; i++) {
      var cat = data.categorias[i];
      if (typeof cat.id !== 'number' || cat.id < 1 || cat.id > 5) {
        return { valido: false, error: 'Categoría #' + (i + 1) + ': id debe ser número entre 1 y 5' };
      }
      if (!cat.nombre || typeof cat.nombre !== 'string' || cat.nombre.trim() === '') {
        return { valido: false, error: 'Categoría #' + (i + 1) + ': nombre requerido' };
      }
      if (!cat.modalidades || typeof cat.modalidades !== 'object') {
        return { valido: false, error: 'Categoría #' + (i + 1) + ': modalidades requerido' };
      }
      for (var mod in cat.modalidades) {
        if (!cat.modalidades.hasOwnProperty(mod)) continue;
        var rates = cat.modalidades[mod];
        if (typeof rates.valor_hora !== 'number' || rates.valor_hora <= 0) {
          return { valido: false, error: 'Categoría #' + (i + 1) + ' (' + mod + '): valor_hora debe ser número positivo' };
        }
        if (typeof rates.valor_mensual !== 'number' || rates.valor_mensual <= 0) {
          return { valido: false, error: 'Categoría #' + (i + 1) + ' (' + mod + '): valor_mensual debe ser número positivo' };
        }
      }
    }
    return { valido: true };
  }

  function importJSON(jsonData) {
    var validacion = validarSchema(jsonData);
    if (!validacion.valido) {
      return { exito: false, error: validacion.error };
    }
    cargar();
    categorias = jsonData.categorias;
    persistir();
    return { exito: true };
  }

  function exportJSON() {
    cargar();
    return JSON.stringify({
      version: 1,
      categorias: categorias,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  function resetToDefaults(fuente) {
    if (fuente) fuenteActiva = fuente;
    categorias = getFuenteDefault(fuenteActiva);
    persistir();
  }

  function setFuente(fuente) {
    if (!FUENTES[fuente]) return false;
    fuenteActiva = fuente;
    resetToDefaults(fuente);
    return true;
  }

  function getFuente() {
    return fuenteActiva;
  }

  function getFuentesDisponibles() {
    var list = [];
    for (var key in FUENTES) {
      if (FUENTES.hasOwnProperty(key)) {
        list.push({ id: key, nombre: FUENTES[key].nombre });
      }
    }
    return list;
  }

  function aplicarAumentos(tabla, mes, anio) {
    var factor = 1;
    for (var i = 0; i < aumentosProgramados.length; i++) {
      var aum = aumentosProgramados[i];
      if (anio > aum.anio || (anio === aum.anio && mes >= aum.mes)) {
        factor *= (1 + aum.porcentaje / 100);
      }
    }
    if (factor === 1) return tabla;

    var ajustada = JSON.parse(JSON.stringify(tabla));
    for (var i = 0; i < ajustada.length; i++) {
      for (var mod in ajustada[i].modalidades) {
        if (!ajustada[i].modalidades.hasOwnProperty(mod)) continue;
        var rates = ajustada[i].modalidades[mod];
        rates.valor_hora = Math.round(rates.valor_hora * factor * 100) / 100;
        rates.valor_mensual = Math.round(rates.valor_mensual * factor * 100) / 100;
      }
    }
    return ajustada;
  }

  // Cargar al inicio
  cargar();

  return {
    getAll: getAll,
    getById: getById,
    update: update,
    importJSON: importJSON,
    exportJSON: exportJSON,
    resetToDefaults: resetToDefaults,
    aplicarAumentos: aplicarAumentos,
    setFuente: setFuente,
    getFuente: getFuente,
    getFuentesDisponibles: getFuentesDisponibles,
    getFuenteDefault: getFuenteDefault,
    getSnrBrackets: function () { return snrBrackets; },
    getAumentos: function () { return aumentosProgramados; }
  };
})();
