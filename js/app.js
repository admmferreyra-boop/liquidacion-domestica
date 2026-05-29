/* Liquidación Doméstica — app.js
   Orquestador: inicializa módulos, conecta eventos, maneja el flujo de cálculo
   Depende de: storage.js, categories.js, calculator.js, ui.js */

var LD = window.LD || {};

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Estado global de la aplicación                                    */
  /* ------------------------------------------------------------------ */
  var state = {
    categorias: [],
    ultimoCalculo: null,
    configForm: {}
  };

  /* ------------------------------------------------------------------ */
  /*  Inicialización                                                    */
  /* ------------------------------------------------------------------ */
  function init() {
    state.categorias = LD.Categories.getAll();
    var fuenteActual = LD.Categories.getFuente();
    var fuentes = LD.Categories.getFuentesDisponibles();

    // Siempre arrancar limpio — sin persistencia entre sesiones
    state.configForm = {};

    // Renderizar formulario
    var formContainer = document.getElementById('form-container');
    if (formContainer) {
      LD.UI.renderForm(formContainer, state.categorias, state.configForm, fuentes, fuenteActual);
    }

    // Renderizar tabla de categorías
    var tableContainer = document.getElementById('category-table-container');
    if (tableContainer) {
      LD.UI.renderCategoryTable(tableContainer, state.categorias, handleEditCategory, LD.Categories.getFuente());
      LD.UI.bindCategoryEvents({
        onExportJSON: handleExportJSON,
        onImportJSON: handleImportJSON,
        onResetDefaults: handleResetDefaults
      });
    }
    // Bindear eventos del formulario
    LD.UI.bindFormEvents({
      onCalcular: handleCalcular,
      onCategoriaChange: handleCategoriaChange
    });

    LD.UI.bindExtraEvents({
      onFuenteChange: handleFuenteChange
    });

    // Mostrar antigüedad si hay fecha guardada (aunque no haya, por si el navegador autocompleta)
    if (typeof LD.UI.actualizarAntiguedadDisplay === 'function') {
      LD.UI.actualizarAntiguedadDisplay();
    }
  }

  function handleFuenteChange(fuente) {
    LD.Categories.setFuente(fuente);
    state.categorias = LD.Categories.getAll();
    state.configForm.fuente = fuente;

    // Actualizar tabla de categorías
    var tableContainer = document.getElementById('category-table-container');
    if (tableContainer) {
      LD.UI.renderCategoryTable(tableContainer, state.categorias, handleEditCategory, fuente);
    }

    // Recalcular si hay resultado visible
    if (state.ultimoCalculo) {
      handleCalcular();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

  function handleCalcular() {
    var formContainer = document.getElementById('form-container');
    var values = LD.UI.getFormValues();

    // Validar
    var errors = LD.UI.validateForm(values);
    LD.UI.showErrors(formContainer, errors);
    if (errors.length > 0) {
      LD.UI.scrollTo('form-section');
      return;
    }

    // Obtener tabla actualizada (con aumentos según período)
    var tabla = LD.Categories.getAll();
    tabla = LD.Categories.aplicarAumentos(tabla, values.mes, values.anio);

    // Calcular
    var resultado = LD.Calculator.calcularSueldo(values, tabla);

    if (resultado.error) {
      LD.UI.showErrors(formContainer, [resultado.error]);
      return;
    }

    state.ultimoCalculo = resultado;

    // Sin persistencia

    // Mostrar resultados
    var resultContainer = document.getElementById('result-container');
    if (resultContainer) {
      LD.UI.renderResults(resultContainer, resultado);
    }

    LD.UI.scrollTo('result-section');
  }

  function handleCategoriaChange(categoriaId) {
    // Actualizar campos específicos si es necesario
    state.configForm.categoriaId = categoriaId;
  }

  function handleEditCategory(catId, modalidad, campo, valor) {
    var ok = LD.Categories.update(catId, modalidad, campo, valor);
    if (ok) {
      state.categorias = LD.Categories.getAll();
      // Si hay resultado visible, recalcular automáticamente
      if (state.ultimoCalculo) {
        handleCalcular();
      }
    }
  }

  function handleExportJSON() {
    var json = LD.Categories.exportJSON();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'afip-rates.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImportJSON(file) {
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        var data = JSON.parse(e.target.result);
        var result = LD.Categories.importJSON(data);
        var tableContainer = document.getElementById('category-table-container');
        if (result.exito) {
          state.categorias = LD.Categories.getAll();
          if (tableContainer) {
            LD.UI.renderCategoryTable(tableContainer, state.categorias, handleEditCategory, LD.Categories.getFuente());
            LD.UI.bindCategoryEvents({
              onExportJSON: handleExportJSON,
              onImportJSON: handleImportJSON,
              onResetDefaults: handleResetDefaults
            });
          }
          // Recalcular si hay resultado
          if (state.ultimoCalculo) {
            handleCalcular();
          }
          LD.UI.showMessage(tableContainer || document.body, 'success', 'Tabla importada correctamente');
        } else {
          LD.UI.showMessage(tableContainer || document.body, 'error', result.error || 'Error al importar');
        }
      } catch (parseError) {
        var tc = document.getElementById('category-table-container');
        LD.UI.showMessage(tc || document.body, 'error', 'El archivo no contiene JSON válido');
      }
    };
    reader.readAsText(file);
  }

  function handleResetDefaults() {
    LD.Categories.resetToDefaults();
    state.categorias = LD.Categories.getAll();
    var tableContainer = document.getElementById('category-table-container');
    if (tableContainer) {
      LD.UI.renderCategoryTable(tableContainer, state.categorias, handleEditCategory, LD.Categories.getFuente());
      LD.UI.bindCategoryEvents({
        onExportJSON: handleExportJSON,
        onImportJSON: handleImportJSON,
        onResetDefaults: handleResetDefaults
      });
    }
    // Recalcular si hay resultado visible
    if (state.ultimoCalculo) {
      handleCalcular();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Arranque                                                          */
  /* ------------------------------------------------------------------ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
