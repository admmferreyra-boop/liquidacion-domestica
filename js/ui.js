/* Liquidación Doméstica — ui.js
   Manipulación del DOM: renderizado de formulario, resultados, tabla de categorías, eventos
   No conoce storage ni calculator — recibe datos y callbacks desde app.js */

var LD = window.LD || {};

LD.UI = (function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Formateo ARS: $X.XXX,XX                                           */
  /* ------------------------------------------------------------------ */
  function formatARS(monto) {
    if (monto === null || monto === undefined || isNaN(monto)) return '$0,00';
    var abs = Math.abs(monto);
    var entero = Math.floor(abs);
    var dec = Math.round((abs - entero) * 100);
    var signo = monto < 0 ? '-' : '';
    var str = String(entero);
    var partes = [];
    for (var i = str.length; i > 0; i -= 3) {
      partes.unshift(str.substring(Math.max(0, i - 3), i));
    }
    return signo + '$' + partes.join('.') + ',' + String(dec).padStart(2, '0');
  }

  /* Calcula antigüedad en años según regla AFIP:
     - El cómputo empieza desde septiembre 2021 (no antes)
     - 1% por cada año desde esa fecha de inicio */
  function calcularAntiguedadDesdeFecha(fechaIngreso, mes, anio) {
    if (!fechaIngreso) return 0;
    var partes = fechaIngreso.split('-');
    if (partes.length !== 3) return 0;
    var ingreso = new Date(parseInt(partes[0], 10), parseInt(partes[1], 10) - 1, parseInt(partes[2], 10));
    if (isNaN(ingreso.getTime())) return 0;

    // La antigüedad arranca desde septiembre 2021 (AFIP)
    var inicio = new Date(2021, 8, 1); // Septiembre 2021
    if (ingreso > inicio) inicio = ingreso; // Si ingresó después, desde esa fecha

    var fin = new Date(anio, mes - 1, 1);
    var diff = fin.getFullYear() - inicio.getFullYear();
    var m = fin.getMonth() - inicio.getMonth();
    if (m < 0 || (m === 0 && fin.getDate() < inicio.getDate())) {
      diff--;
    }
    return Math.max(0, diff);
  }

  /* ------------------------------------------------------------------ */
  /*  Renderizado del formulario                                        */
  /* ------------------------------------------------------------------ */
  function renderForm(container, categorias, savedState, fuentes, fuenteActual) {
    var meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    var opcionesCat = categorias.map(function (c) {
      return '<option value="' + c.id + '">' + c.nombre + '</option>';
    }).join('');

    var opcionesMes = meses.map(function (m, i) {
      var selected = (savedState && savedState.mes === (i + 1)) ? ' selected' : '';
      return '<option value="' + (i + 1) + '"' + selected + '>' + m + '</option>';
    }).join('');

    var anioActual = new Date().getFullYear();
    var opcionesAnio = '';
    for (var a = 2026; a <= 2030; a++) {
      var sel = (savedState && savedState.anio === a) ? ' selected' : (a === anioActual ? ' selected' : '');
      opcionesAnio += '<option value="' + a + '"' + sel + '>' + a + '</option>';
    }

    /* Opciones de fuente */
    var opcionesFuente = '';
    if (fuentes && Array.isArray(fuentes)) {
      opcionesFuente = fuentes.map(function (f) {
        var sel = (f.id === fuenteActual) ? ' selected' : '';
        return '<option value="' + f.id + '"' + sel + '>' + f.nombre + '</option>';
      }).join('');
    }

    var s = savedState || {};

    /* SAC visible solo en Junio (6) o Diciembre (12) */
    var mesActual = s.mes || 1;
    var mostrarSAC = (mesActual === 6 || mesActual === 12);
    var estiloSAC = mostrarSAC ? '' : ' style="display:none"';

    var html =
      '<form id="form-liquidacion" class="Form" novalidate>' +

      /* Período */
      '<fieldset class="Form-fieldset">' +
        '<legend class="Form-legend">Período</legend>' +
        '<div class="Form-row Form-row--periodo">' +
          '<div class="Form-group">' +
            '<label class="Form-label" for="input-mes">Mes</label>' +
            '<select class="Form-input Form-select" id="input-mes">' + opcionesMes + '</select>' +
          '</div>' +
          '<div class="Form-group">' +
            '<label class="Form-label" for="input-anio">Año</label>' +
            '<select class="Form-input Form-select" id="input-anio">' + opcionesAnio + '</select>' +
          '</div>' +
        '</div>' +
      '</fieldset>' +

      /* Fuente de la escala */
      '<fieldset class="Form-fieldset">' +
        '<legend class="Form-legend">Escala salarial de referencia</legend>' +
        '<div class="Form-group">' +
          '<select class="Form-input Form-select" id="input-fuente">' +
            opcionesFuente +
          '</select>' +
        '</div>' +
      '</fieldset>' +

      /* Modalidad */
      '<fieldset class="Form-fieldset">' +
        '<legend class="Form-legend">Modalidad de liquidación</legend>' +
        '<div class="Form-radios">' +
          radioHTML('modalidad', 'diaria', 'Diaria', s.modalidad) +
          radioHTML('modalidad', 'semanal', 'Semanal', s.modalidad) +
          radioHTML('modalidad', 'quincenal', 'Quincenal', s.modalidad) +
          radioHTML('modalidad', 'mensual', 'Mensual', s.modalidad) +
          radioHTML('modalidad', 'otro', 'Otro', s.modalidad) +
        '</div>' +
      '</fieldset>' +

      /* Datos de la empleada */
      '<fieldset class="Form-fieldset">' +
        '<legend class="Form-legend">Datos de la empleada</legend>' +
        '<div class="Form-group">' +
          '<label class="Form-label" for="input-categoria">Categoría</label>' +
          '<select class="Form-input Form-select" id="input-categoria">' +
            '<option value="">— Seleccionar —</option>' +
            opcionesCat +
          '</select>' +
        '</div>' +
        '<div class="Form-radios Form-radios--retiro">' +
          '<span class="Form-label Form-label--inline">Modalidad de retiro</span>' +
          radioHTML('retiro', 'con_retiro', 'Con retiro', s.retiro) +
          radioHTML('retiro', 'sin_retiro', 'Sin retiro', s.retiro) +
        '</div>' +

        /* Tipo de horas */
        '<div class="Form-radios Form-radios--hs">' +
          '<span class="Form-label Form-label--inline">Tipo de horas</span>' +
          radioHTML('tipoHoras', 'semanales', 'Horas semanales', s.tipoHoras) +
          radioHTML('tipoHoras', 'mensuales', 'Horas mensuales totales', s.tipoHoras) +
        '</div>' +

        '<div class="Form-group" id="grupo-hs-semanales">' +
          '<label class="Form-label" for="input-horas">Horas semanales</label>' +
          '<input class="Form-input" type="number" id="input-horas" min="0.5" max="168" step="0.5" ' +
            'placeholder="Ej: 40" value="' + (s.horasSemanales || '') + '">' +
        '</div>' +
        '<div class="Form-group" id="grupo-hs-mensuales" style="display:none">' +
          '<label class="Form-label" for="input-horas-mensuales">Horas mensuales totales</label>' +
          '<input class="Form-input" type="number" id="input-horas-mensuales" min="1" max="744" step="0.5" ' +
            'placeholder="Ej: 160" value="' + (s.horasMensuales || '') + '">' +
        '</div>' +

        '<div class="Form-group">' +
          '<label class="Form-label" for="input-fecha-ingreso">Fecha de ingreso</label>' +
          '<input class="Form-input" type="date" id="input-fecha-ingreso" ' +
            'value="' + (s.fechaIngreso || '') + '">' +
          '<small class="Form-helper">Antigüedad: 1% por año desde sep/2021 (AFIP)</small>' +
          '<small class="Form-helper" id="antiguedad-calculada"></small>' +
        '</div>' +
      '</fieldset>' +

      /* Adicionales */
      '<fieldset class="Form-fieldset">' +
        '<legend class="Form-legend">Adicionales</legend>' +
        '<div class="Form-checkboxes">' +
          '<label class="Form-checkbox">' +
            '<input type="checkbox" id="check-sumaNR" ' + (s.sumaNR ? 'checked' : '') + '> ' +
            'Suma no remunerativa (automático según horas)' +
          '</label>' +
          '<label class="Form-checkbox">' +
            '<input type="checkbox" id="check-zona" ' + (s.zonaDesfavorable ? 'checked' : '') + '> ' +
            'Zona desfavorable (31% — provincias del sur)' +
          '</label>' +
          '<label class="Form-checkbox">' +
            '<input type="checkbox" id="check-vacaciones" ' + (s.vacaciones ? 'checked' : '') + '> ' +
            'Vacaciones proporcionales (según LCT)' +
          '</label>' +
        '</div>' +

        /* SAC — solo visible en Junio y Diciembre */
        '<div class="Form-group" id="grupo-sac" ' + estiloSAC + '>' +
          '<label class="Form-label" for="input-sac-meses">Meses trabajados en el semestre (SAC)</label>' +
          '<input class="Form-input" type="number" id="input-sac-meses" min="0" max="6" step="1" ' +
            'placeholder="Ej: 6" value="' + (s.sacMeses || '') + '">' +
        '</div>' +

        /* Otro importe extra */
        '<div class="Form-row">' +
          '<div class="Form-group Form-group--half">' +
            '<label class="Form-label" for="input-otro-label">Concepto extra (opcional)</label>' +
            '<input class="Form-input" type="text" id="input-otro-label" ' +
              'placeholder="Ej: Bono" value="' + (s.otroLabel || '') + '">' +
          '</div>' +
          '<div class="Form-group Form-group--half">' +
            '<label class="Form-label" for="input-otro-importe">Importe $</label>' +
            '<input class="Form-input" type="number" id="input-otro-importe" min="0" step="0.01" ' +
              'placeholder="0,00" value="' + (s.otroImporte || '') + '">' +
          '</div>' +
        '</div>' +
      '</fieldset>' +

      /* Botón calcular */
      '<div class="Form-actions">' +
        '<button type="submit" class="Button Button--primary" id="btn-calcular">Calcular Liquidación</button>' +
      '</div>' +

      '</form>';

    container.innerHTML = html;
  }

  function radioHTML(name, value, label, selected) {
    var checked = (selected === value) ? ' checked' : '';
    // Por defecto seleccionar primer radio si no hay selección
    if (!selected && name === 'modalidad' && value === 'mensual') checked = ' checked';
    if (!selected && name === 'retiro' && value === 'con_retiro') checked = ' checked';
    if (!selected && name === 'tipoHoras' && value === 'semanales') checked = ' checked';
    return (
      '<label class="Form-radio">' +
        '<input type="radio" name="' + name + '" value="' + value + '"' + checked + '> ' +
        '<span>' + label + '</span>' +
      '</label>'
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Lectura de valores del formulario                                 */
  /* ------------------------------------------------------------------ */
  function getFormValues() {
    var modalidadEl = document.querySelector('input[name="modalidad"]:checked');
    var retiroEl = document.querySelector('input[name="retiro"]:checked');
    var tipoHorasEl = document.querySelector('input[name="tipoHoras"]:checked');

    return {
      mes: parseInt(document.getElementById('input-mes').value, 10) || 1,
      anio: parseInt(document.getElementById('input-anio').value, 10) || 2026,
      fuente: document.getElementById('input-fuente').value || 'afip',
      modalidadPeriodo: modalidadEl ? modalidadEl.value : 'mensual',
      categoriaId: parseInt(document.getElementById('input-categoria').value, 10) || 0,
      modalidad: retiroEl ? retiroEl.value : 'con_retiro',
      tipoHoras: tipoHorasEl ? tipoHorasEl.value : 'semanales',
      horasSemanales: parseFloat(document.getElementById('input-horas').value) || 0,
      horasMensuales: parseFloat(document.getElementById('input-horas-mensuales').value) || 0,
      antiguedadAnios: calcularAntiguedadDesdeFecha(
        document.getElementById('input-fecha-ingreso').value,
        parseInt(document.getElementById('input-mes').value, 10) || 1,
        parseInt(document.getElementById('input-anio').value, 10) || 2026
      ),
      fechaIngreso: document.getElementById('input-fecha-ingreso').value,
      sumaNR: document.getElementById('check-sumaNR').checked,
      zonaDesfavorable: document.getElementById('check-zona').checked,
      vacaciones: document.getElementById('check-vacaciones').checked,
      sacMeses: parseInt(document.getElementById('input-sac-meses').value, 10) || 0,
      otroLabel: document.getElementById('input-otro-label').value.trim(),
      otroImporte: parseFloat(document.getElementById('input-otro-importe').value) || 0
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Validación del formulario                                         */
  /* ------------------------------------------------------------------ */
  function validateForm(values) {
    var errors = [];
    if (!values.categoriaId || values.categoriaId < 1) {
      errors.push('Seleccioná una categoría');
    }
    if (values.tipoHoras === 'semanales' || values.tipoHoras === undefined) {
      if (values.horasSemanales <= 0 || values.horasSemanales > 168) {
        errors.push('Las horas semanales deben ser entre 1 y 168');
      }
    } else if (values.tipoHoras === 'mensuales') {
      if (values.horasMensuales <= 0 || values.horasMensuales > 744) {
        errors.push('Las horas mensuales deben ser entre 1 y 744');
      }
    }
    if (values.sacMeses < 0 || values.sacMeses > 6) {
      errors.push('Los meses trabajados para SAC deben ser entre 0 y 6');
    }
    return errors;
  }

  /* ------------------------------------------------------------------ */
  /*  Renderizado de resultados                                         */
  /* ------------------------------------------------------------------ */
  function renderResults(container, result) {
    var rows = [
      { label: 'Básico', value: result.basico, highlight: false },
      { label: 'Antigüedad', value: result.antiguedad, highlight: false }
    ];

    if (result.zonaDesfavorable > 0) {
      rows.push({ label: 'Zona desfavorable (31%)', value: result.zonaDesfavorable, highlight: false });
    }

    var subtotalLabel = 'Subtotal';
    var rowsBeforeSubtotal = rows.length;
    rows.push({ label: subtotalLabel, value: result.subtotal, highlight: false });

    if (result.sumaNR > 0) {
      rows.push({ label: 'Suma no remunerativa', value: result.sumaNR, highlight: false });
    }
    if (result.sac > 0) {
      rows.push({ label: 'SAC proporcional', value: result.sac, highlight: false });
    }
    if (result.vacaciones > 0) {
      rows.push({ label: 'Vacaciones proporcionales', value: result.vacaciones, highlight: false });
    }
    if (result.otroImporte > 0) {
      var label = result.otroLabel || 'Otro concepto';
      rows.push({ label: label, value: result.otroImporte, highlight: false });
    }

    var rowsHTML = rows.map(function (r) {
      return (
        '<tr class="Result-row">' +
          '<td class="Result-label">' + r.label + '</td>' +
          '<td class="Result-value">' + formatARS(r.value) + '</td>' +
        '</tr>'
      );
    }).join('');

    var html =
      '<table class="Result">' +
        '<thead class="Result-head">' +
          '<tr><th>Concepto</th><th>Monto</th></tr>' +
        '</thead>' +
        '<tbody>' +
          rowsHTML +
          '<tr class="Result-row Result-row--total">' +
            '<td class="Result-label Result-label--total"><strong>TOTAL</strong></td>' +
            '<td class="Result-value Result-value--total"><strong>' + formatARS(result.total) + '</strong></td>' +
          '</tr>' +
        '</tbody>' +
      '</table>';

    container.innerHTML = html;

    // Mostrar la sección de resultado
    var section = document.getElementById('result-section');
    if (section) {
      section.classList.remove('u-hidden');
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Renderizado de tabla de categorías                                */
  /* ------------------------------------------------------------------ */
  function renderCategoryTable(container, categorias, editHandler, fuenteActual) {
    var modalidades = ['con_retiro', 'sin_retiro'];
    var modLabels = { con_retiro: 'Con retiro', sin_retiro: 'Sin retiro' };

    var fuenteLabel = '';
    if (fuenteActual) {
      var fuentes = LD.Categories.getFuentesDisponibles();
      for (var fi = 0; fi < fuentes.length; fi++) {
        if (fuentes[fi].id === fuenteActual) {
          fuenteLabel = ' — ' + fuentes[fi].nombre;
          break;
        }
      }
    }

    var html =
      '<div class="CategoryTable-header">' +
        '<h3 class="CategoryTable-title">Valores de referencia' + fuenteLabel + '</h3>' +
      '</div>' +
      '<div class="CategoryTable-wrapper">' +
        '<table class="CategoryTable">' +
          '<thead>' +
            '<tr>' +
              '<th>Categoría</th>';

    for (var m = 0; m < modalidades.length; m++) {
      var modKey = modalidades[m];
      html += '<th class="CategoryTable-col--mod">' + modLabels[modKey] + '<br><small>hora</small></th>';
      html += '<th class="CategoryTable-col--mod">' + modLabels[modKey] + '<br><small>mensual</small></th>';
    }

    html += '</tr></thead><tbody>';

    for (var i = 0; i < categorias.length; i++) {
      var cat = categorias[i];
      html += '<tr class="CategoryTable-row">' +
        '<td class="CategoryTable-cell CategoryTable-cell--name">' +
          '<strong>' + cat.nombre + '</strong><br><small>' + cat.descripcion + '</small>' +
        '</td>';

      for (var m2 = 0; m2 < modalidades.length; m2++) {
        var modKey2 = modalidades[m2];
        var rates = cat.modalidades[modKey2];
        if (rates) {
          html +=
            '<td class="CategoryTable-cell CategoryTable-cell--editable" ' +
              'data-cat-id="' + cat.id + '" data-modalidad="' + modKey2 + '" data-campo="valor_hora">' +
              formatARS(rates.valor_hora) +
            '</td>' +
            '<td class="CategoryTable-cell CategoryTable-cell--editable" ' +
              'data-cat-id="' + cat.id + '" data-modalidad="' + modKey2 + '" data-campo="valor_mensual">' +
              formatARS(rates.valor_mensual) +
            '</td>';
        } else {
          html +=
            '<td class="CategoryTable-cell CategoryTable-cell--na">—</td>' +
            '<td class="CategoryTable-cell CategoryTable-cell--na">—</td>';
        }
      }

      html += '</tr>';
    }

    html += '</tbody></table></div>';

    container.innerHTML = html;

    // Binding inline edit: click en celda → input temporal
    var celdas = container.querySelectorAll('.CategoryTable-cell--editable');
    for (var ci = 0; ci < celdas.length; ci++) {
      celdas[ci].addEventListener('click', function (e) {
        var celda = e.currentTarget;
        if (celda.querySelector('input')) return; // ya editando

        var currentText = celda.textContent.trim();
        var currentValue = parseFloat(
          currentText.replace(/[^0-9,]/g, '').replace(',', '.')
        ) || 0;

        var input = document.createElement('input');
        input.type = 'number';
        input.step = '0.01';
        input.min = '0.01';
        input.className = 'CategoryTable-input';
        input.value = currentValue;

        celda.textContent = '';
        celda.appendChild(input);
        input.focus();
        input.select();

        function finalize(save) {
          var newVal = save ? parseFloat(input.value) : null;
          if (save && !isNaN(newVal) && newVal > 0) {
            celda.textContent = LD.UI.formatARS(newVal);
            if (typeof editHandler === 'function') {
              editHandler(
                parseInt(celda.getAttribute('data-cat-id'), 10),
                celda.getAttribute('data-modalidad'),
                celda.getAttribute('data-campo'),
                newVal
              );
            }
          } else {
            celda.textContent = currentText;
            if (save) {
              alert('El valor debe ser un número positivo');
            }
          }
        }

        input.addEventListener('blur', function () { finalize(true); });
        input.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter') { ev.preventDefault(); input.blur(); }
          if (ev.key === 'Escape') { ev.preventDefault(); finalize(false); }
        });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Error display                                                     */
  /* ------------------------------------------------------------------ */
  function showErrors(container, errors) {
    if (!errors || errors.length === 0) {
      var existing = container.querySelector('.Form-errors');
      if (existing) existing.remove();
      return;
    }
    var html = '<div class="Form-errors" role="alert">' +
      '<p class="Form-errors-title">Corregí los siguientes errores:</p>' +
      '<ul class="Form-errors-list">';
    for (var i = 0; i < errors.length; i++) {
      html += '<li>' + errors[i] + '</li>';
    }
    html += '</ul></div>';

    // Remover errores previos
    var existing2 = container.querySelector('.Form-errors');
    if (existing2) existing2.remove();

    container.insertAdjacentHTML('afterbegin', html);
  }

  function showMessage(container, type, text) {
    var className = type === 'error' ? 'Message--error' : 'Message--success';
    var html = '<div class="Message ' + className + '">' + text + '</div>';
    container.insertAdjacentHTML('afterbegin', html);
  }

  /* ------------------------------------------------------------------ */
  /*  Binding de eventos del formulario                                 */
  /* ------------------------------------------------------------------ */
  function bindFormEvents(handlers) {
    var form = document.getElementById('form-liquidacion');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof handlers.onCalcular === 'function') {
        handlers.onCalcular();
      }
    });

    var categoriaSelect = document.getElementById('input-categoria');
    if (categoriaSelect && typeof handlers.onCategoriaChange === 'function') {
      categoriaSelect.addEventListener('change', function () {
        handlers.onCategoriaChange(getFormValues().categoriaId);
      });
    }

    /* Cambio de mes → mostrar/ocultar SAC */
    var mesSelect = document.getElementById('input-mes');
    if (mesSelect) {
      mesSelect.addEventListener('change', function () {
        var mes = parseInt(this.value, 10) || 1;
        var grupoSAC = document.getElementById('grupo-sac');
        if (grupoSAC) {
          grupoSAC.style.display = (mes === 6 || mes === 12) ? '' : 'none';
        }
      });
    }

    /* Cambio de tipo de horas */
    var radiosTipoHoras = document.querySelectorAll('input[name="tipoHoras"]');
    for (var r = 0; r < radiosTipoHoras.length; r++) {
      radiosTipoHoras[r].addEventListener('change', function () {
        var tipo = this.value;
        var grpSem = document.getElementById('grupo-hs-semanales');
        var grpMes = document.getElementById('grupo-hs-mensuales');
        if (grpSem) grpSem.style.display = (tipo === 'semanales') ? '' : 'none';
        if (grpMes) grpMes.style.display = (tipo === 'mensuales') ? '' : 'none';
      });
    }

    /* Fecha de ingreso → mostrar antigüedad calculada */
    var fechaInput = document.getElementById('input-fecha-ingreso');
    if (fechaInput) {
      fechaInput.addEventListener('change', function () {
        actualizarAntiguedadDisplay();
      });
    }

    /* También al cambiar mes/año */
    if (mesSelect) {
      mesSelect.addEventListener('change', actualizarAntiguedadDisplay);
    }
    var anioSelect = document.getElementById('input-anio');
    if (anioSelect) {
      anioSelect.addEventListener('change', actualizarAntiguedadDisplay);
    }
  }

  function actualizarAntiguedadDisplay() {
    var fechaInput = document.getElementById('input-fecha-ingreso');
    var helper = document.getElementById('antiguedad-calculada');
    if (!fechaInput || !helper) return;
    var mes = parseInt(document.getElementById('input-mes').value, 10) || 1;
    var anio = parseInt(document.getElementById('input-anio').value, 10) || 2026;
    var años = calcularAntiguedadDesdeFecha(fechaInput.value, mes, anio);
    if (años > 0) {
      var pct = Math.min(años, 20);
      helper.textContent = 'Antigüedad: ' + años + ' año' + (años !== 1 ? 's' : '') + ' → ' + pct + '% (desde sep/2021)';
      helper.className = 'Form-helper Form-helper--visible';
    } else if (fechaInput.value) {
      helper.textContent = 'Antigüedad: 0 años — aún no cumple un año desde sep/2021';
      helper.className = 'Form-helper Form-helper--visible';
    } else {
      helper.textContent = '';
      helper.className = 'Form-helper';
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Binding de eventos de la tabla de categorías                      */
  /* ------------------------------------------------------------------ */
  function bindCategoryEvents(handlers) {
    var exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        if (typeof handlers.onExportJSON === 'function') handlers.onExportJSON();
      });
    }

    var importInput = document.getElementById('btn-import-json');
    if (importInput) {
      importInput.addEventListener('change', function (e) {
        if (e.target.files.length > 0 && typeof handlers.onImportJSON === 'function') {
          handlers.onImportJSON(e.target.files[0]);
        }
        // Reset para permitir re-importar el mismo archivo
        e.target.value = '';
      });
    }

    var resetBtn = document.getElementById('btn-reset-defaults');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (typeof handlers.onResetDefaults === 'function') {
          if (confirm('¿Restaurar valores default de AFIP? Esto descartará cualquier cambio manual.')) {
            handlers.onResetDefaults();
          }
        }
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Utilidades                                                        */
  /* ------------------------------------------------------------------ */
  function scrollTo(elementId) {
    var el = document.getElementById(elementId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ------------------------------------------------------------------ */
  /*  Eventos extra: fuente, etc.                                       */
  /* ------------------------------------------------------------------ */
  function bindExtraEvents(handlers) {
    var fuenteSelect = document.getElementById('input-fuente');
    if (fuenteSelect && typeof handlers.onFuenteChange === 'function') {
      fuenteSelect.addEventListener('change', function () {
        handlers.onFuenteChange(this.value);
      });
    }
  }

  return {
    formatARS: formatARS,
    renderForm: renderForm,
    getFormValues: getFormValues,
    validateForm: validateForm,
    renderResults: renderResults,
    renderCategoryTable: renderCategoryTable,
    showErrors: showErrors,
    showMessage: showMessage,
    bindFormEvents: bindFormEvents,
    bindCategoryEvents: bindCategoryEvents,
    bindExtraEvents: bindExtraEvents,
    scrollTo: scrollTo,
    actualizarAntiguedadDisplay: actualizarAntiguedadDisplay
  };
})();
