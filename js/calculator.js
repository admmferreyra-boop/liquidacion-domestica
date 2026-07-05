/* Liquidación Doméstica — calculator.js
   Funciones puras de liquidación: básico, antigüedad, suma NR, SAC, vacaciones, zona desfavorable
   Sin side effects, sin DOM, sin storage */

var LD = window.LD || {};

LD.Calculator = (function () {
  'use strict';

  function redondear(v) {
    return Math.round(v * 100) / 100;
  }

  /**
   * Calcula el básico.
   * tipoHoras: 'semanales' | 'mensuales'
   * Si es semanales: < 24h → valor_hora × horas_mes ; ≥ 24h → valor_mensual
   * Si es mensuales: úsalas directamente para valor_hora o valor_mensual según threshold
   */
  function calcularBasico(categoriaId, modalidad, horasSemanales, horasMensuales, tipoHoras, tabla) {
    if (!tabla || !Array.isArray(tabla)) return 0;
    if (!modalidad) return 0;

    var cat = null;
    for (var i = 0; i < tabla.length; i++) {
      if (tabla[i].id === categoriaId) { cat = tabla[i]; break; }
    }
    if (!cat) return 0;

    var rates = cat.modalidades[modalidad];
    if (!rates) return 0;

    if (tipoHoras === 'mensuales') {
      var hm = parseFloat(horasMensuales) || 0;
      return redondear(rates.valor_hora * hm);
    }

    // tipoHoras === 'semanales' (default)
    var hs = parseFloat(horasSemanales) || 0;
    if (hs < 24) {
      var horasMes = redondear(hs * 52 / 12);
      return redondear(rates.valor_hora * horasMes);
    } else {
      return rates.valor_mensual;
    }
  }

  /**
   * Antigüedad: 1% por año, máx 20%
   */
  function calcularAntiguedad(basico, anios) {
    var a = parseInt(anios, 10) || 0;
    var pct = Math.min(a, 20);
    return redondear(basico * pct / 100);
  }

  /**
   * Zona desfavorable: 31% del básico (solo provincias del sur)
   */
  function calcularZonaDesfavorable(basico) {
    return redondear(basico * 0.31);
  }

  /**
   * Suma no remunerativa según horas semanales.
   * Los montos se leen desde categories.js (actualizables vía data/afip-defaults.json)
   */
  function calcularSumaNoRemunerativa(horasSemanales) {
    var brackets = (LD.Categories.getSnrBrackets && LD.Categories.getSnrBrackets()) || [];
    var hs = parseFloat(horasSemanales) || 0;

    for (var i = 0; i < brackets.length; i++) {
      var b = brackets[i];
      var minOk = (b.minHoras === undefined || hs >= b.minHoras);
      var maxOk = (b.maxHoras === undefined || hs < b.maxHoras);
      // Para el último bracket sin maxHoras (≥ 16h)
      if (b.minHoras !== undefined && b.maxHoras === undefined && hs >= b.minHoras) {
        return b.monto;
      }
      if (minOk && maxOk) {
        return b.monto;
      }
    }
    return 4000; // fallback seguro
  }

  /**
   * SAC proporcional: (mejor_salario / 2) × (meses_trabajados / 6)
   */
  function calcularSAC(mejorSalario, mesesTrabajados) {
    var meses = parseInt(mesesTrabajados, 10) || 0;
    if (meses <= 0) return 0;
    return redondear((mejorSalario / 2) * (meses / 6));
  }

  /**
   * Vacaciones según LCT:
   *   < 5 años → 14 días
   *   5-9 años → 21 días
   *   10-19 años → 28 días
   *   ≥ 20 años → 35 días
   *   Valor: (básico / 25) × días
   */
  function calcularVacaciones(basico, antiguedadAnios) {
    var anios = parseInt(antiguedadAnios, 10) || 0;
    var dias;
    if (anios < 5) dias = 14;
    else if (anios < 10) dias = 21;
    else if (anios < 20) dias = 28;
    else dias = 35;
    return redondear((basico / 25) * dias);
  }

  /**
   * Cálculo completo de liquidación.
   * input: { categoriaId, modalidad, horasSemanales, horasMensuales, tipoHoras,
   *          antiguedadAnios, sumaNR, zonaDesfavorable, vacaciones, sacMeses,
   *          otroImporte, otroLabel }
   * tabla: array de categorías desde categories.js
   */
  function calcularSueldo(inputs, tabla) {
    if (!inputs || !tabla) {
      return { error: 'Faltan datos de entrada o tabla de categorías' };
    }

    var modalidad = inputs.modalidad || 'con_retiro';
    var tipoHoras = inputs.tipoHoras || 'semanales';

    var basico = calcularBasico(
      inputs.categoriaId, modalidad,
      inputs.horasSemanales, inputs.horasMensuales, tipoHoras, tabla
    );

    var antiguedad = calcularAntiguedad(basico, inputs.antiguedadAnios);
    var subtotal = redondear(basico + antiguedad);

    var zonaDesfavorable = inputs.zonaDesfavorable
      ? calcularZonaDesfavorable(basico)
      : 0;

    var horasParaSNR = (tipoHoras === 'mensuales')
      ? redondear(inputs.horasMensuales * 12 / 52)
      : (parseFloat(inputs.horasSemanales) || 0);

    var sumaNR = inputs.sumaNR
      ? calcularSumaNoRemunerativa(horasParaSNR)
      : 0;

    var baseSAC = redondear(subtotal + zonaDesfavorable);

    var sac = (inputs.sacMeses && parseInt(inputs.sacMeses, 10) > 0)
      ? calcularSAC(baseSAC, inputs.sacMeses)
      : 0;

    var vacaciones = inputs.vacaciones
      ? calcularVacaciones(basico, inputs.antiguedadAnios)
      : 0;

    var otroImporte = (inputs.otroImporte && parseFloat(inputs.otroImporte) > 0)
      ? redondear(parseFloat(inputs.otroImporte))
      : 0;

    var total = redondear(subtotal + zonaDesfavorable + sumaNR + sac + vacaciones + otroImporte);

    return {
      basico: basico,
      antiguedad: antiguedad,
      subtotal: subtotal,
      zonaDesfavorable: zonaDesfavorable,
      sumaNR: sumaNR,
      sac: sac,
      vacaciones: vacaciones,
      otroImporte: otroImporte,
      otroLabel: (otroImporte > 0 && inputs.otroLabel) ? inputs.otroLabel : '',
      total: total
    };
  }

  return {
    redondear: redondear,
    calcularBasico: calcularBasico,
    calcularAntiguedad: calcularAntiguedad,
    calcularZonaDesfavorable: calcularZonaDesfavorable,
    calcularSumaNoRemunerativa: calcularSumaNoRemunerativa,
    calcularSAC: calcularSAC,
    calcularVacaciones: calcularVacaciones,
    calcularSueldo: calcularSueldo
  };
})();
