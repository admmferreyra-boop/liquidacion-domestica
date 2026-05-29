# Design: App Liquidación Doméstica — MVP

## Technical Approach

SPA vanilla con 5 módulos JS (IIFE pattern) acoplados por inyección de dependencias manual desde `app.js`. Cada módulo es una responsabilidad única: cálculo puro, datos AFIP, persistencia, DOM, orquestación. El formulario guía al usuario en flujo vertical: período → empleada → horas → adicionales → resultado.

## Architecture Overview

```
index.html
  └── css/styles.css
  └── js/
      ├── storage.js       ← capa base: localStorage con namespace y versionado
      ├── categories.js    ← ← →→ storage.js: datos AFIP con CRUD + import/export
      ├── calculator.js    ← ← →→ categories.js: lee tabla para calcular
      ├── ui.js            ← solo DOM, no llama a nada
      └── app.js           ← orquestador: importa los 4, conecta eventos
```

**Responsabilidades**:

| Módulo | Rol | Conoce |
|--------|-----|--------|
| `storage.js` | Persistencia con schema versioning | Solo localStorage |
| `categories.js` | Tabla AFIP (default + editada) | storage.js |
| `calculator.js` | Fórmulas de liquidación (puras) | categories.js (vía app.js) |
| `ui.js` | Renderizado y eventos del DOM | Nada — recibe datos |
| `app.js` | Coordina todo | Los 4 módulos |

## Architecture Decisions

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| IIFE vs ES modules | Sin build, IIFE poluye global scope pero funciona en todos lados | IIFE con namespace explícito (`window.LD = {}`) |
| Estado global vs parámetros | Global simplifica pero acopla | Objeto `state` en app.js, pasado a ui.js como parámetro |
| Tabla AFIP embebida vs fetch | Fetch requiere servidor, embebida funciona offline | JSON embebido en categories.js como default, persistencia en storage.js |

## Form Structure

```
┌──────────────────────────────────┐
│  Período                         │
│  [Mes ▼] [Año]                   │
├──────────────────────────────────┤
│  Modalidad de liquidación        │
│  ○ Diaria  ○ Semanal  ○ Quincenal│
│  ○ Mensual  ○ Otro               │
├──────────────────────────────────┤
│  Datos de la empleada            │
│  Categoría [▼ 5 opciones]        │
│  ○ Con retiro  ○ Sin retiro      │
│  Horas/mes [___]                 │
│  Antigüedad [___] años           │
├──────────────────────────────────┤
│  Adicionales                     │
│  ☐ Suma no remunerativa          │
│  SAC: meses trabajados [___]     │
├──────────────────────────────────┤
│  [ CALCULAR ]                    │
├──────────────────────────────────┤
│  Resultado                       │
│  Básico               $401.799,60│
│  Antigüedad (3%)       $12.053,99│
│  Subtotal              $413.853,59│
│  Suma NR                 $5.750,00│
│  SAC proporcional      $70.892,26│
│  ─────────────────────────────── │
│  TOTAL                 $496.245,85│
└──────────────────────────────────┘
```

## Component / Module Design

### calculator.js — Pure functions

```js
// calculator.js — sin side effects
function calcularSueldo({ categoria, modalidad, horasMes, antiguedadAnios,
                          sumaNRHoras, sacMeses }, tablaCategorias) {
  const basico = calcularBasico(categoria, modalidad, horasMes, tablaCategorias);
  const antiguedad = calcularAntiguedad(basico, antiguedadAnios);
  const subtotal = redondear(basico + antiguedad);
  const sumaNR = sumaNRHoras ? calcularSumaNoRemunerativa(horasSemanales, modalidad) : 0;
  const sac = calcularSAC(subtotal, sacMeses);
  const total = redondear(subtotal + sumaNR + sac);
  return { basico, antiguedad, subtotal, sumaNR, sac, total };
}
```

Exporta: `calcularBasico`, `calcularAntiguedad`, `calcularSumaNoRemunerativa`, `calcularSAC`, `calcularSueldo`. Todas reciben parámetros, devuelven float(2). Ninguna toca DOM ni storage.

### categories.js — AFIP data store

- **Default table**: array de 5 categorías embebido en el código (Mayo 2026 AFIP values).
- **API**: `getAll()`, `getById(id)`, `update(id, modalidad, campo, valor)`, `importJSON(file)`, `exportJSON()`.
- **Persistence**: llama a `storage.save('afipRates', data)` tras cada mutación.
- **Validation**: rechaza valores vacíos, negativos, no numéricos; schema check en import.

### storage.js — localStorage wrapper

- Namespace: `liquidacion-domestica:{key}`.
- Schema version: entero `version` guardado con cada dato. Mismatch → descarta y devuelve default.
- API: `save(key, data)`, `load(key, defaults)`, `remove(key)`, `exportAll()`, `importAll(data)`.
- Error handling: JSON corrupto → `console.warn` + default. QuotaExceeded → callback + preserva estado.

### ui.js — DOM manipulation

- Funciones puras de renderizado: `renderForm(container)`, `renderResults(container, result)`, `renderCategoryTable(container, categorias)`.
- Binding: `bindFormEvents(appHandlers)` — recibe callbacks desde app.js, no importa módulos.
- Formatea montos en ARS con separador de miles: `$401.799,60`.
- Muestra/oculta secciones (resultado aparece post-cálculo).

### app.js — Coordinator

```js
const state = {
  categorias: [],        // cargadas vía categories.getAll()
  ultimoCalculo: null,   // último resultado de calculator.calcularSueldo()
  configForm: {}         // última configuración del formulario
};

function init() {
  state.categorias = Categories.getAll();
  UI.renderForm('#app');
  UI.renderCategoryTable('#admin-table', state.categorias);
  UI.bindFormEvents({
    onCalcular: handleCalcular,
    onCategoriaChange: handleCategoriaChange,
    onImportJSON: handleImportJSON,
    onExportJSON: handleExportJSON,
    onEditCategory: handleEditCategory
  });
}
```

## Data Flow

```
1. Usuario completa formulario (período, categoría, horas, etc.)
2. Click "Calcular"
3. app.js.onCalcular():
   a. Lee valores del DOM via ui.js helpers (o directamente)
   b. Valida campos (horas > 0, categoría válida, etc.)
   c. Obtiene tabla actual → Categories.getAll()
   d. Ejecuta → calculator.calcularSueldo(inputs, tabla)
   e. Actualiza state.ultimoCalculo
   f. Llama → UI.renderResults(container, resultado)
   g. Guarda config → storage.save('configLast', inputs)
4. Usuario ve desglose en pantalla
```

## State Management

Único objeto `state` en `app.js`. Sin framework, sin reactividad — mutación manual seguida de re-render explícito:

```js
const state = { categorias: [], ultimoCalculo: null, configForm: {} };
// Toda mutación va acompañada de un render UI explícito
```

## CSS Architecture

- **Metodología**: SUIT CSS utility-first para layout, componentes modulares.
- **Layout**: Flexbox vertical centrado, max-width 480px para mobile-first.
- **Breakpoints**: 480px (mobile), 768px (tablet), 1024px (desktop). Tabla AFIP pasa a scroll horizontal en mobile.
- **Color scheme**: Fondo claro (#f8f9fa), cards blancas, acento azul AFIP (#0072bc), montos en verde (#28a745).
- **Resultado**: tabla con bordes sutiles, fuente mono para montos, total destacado (bold + fondo).

## File List

| File | Purpose |
|------|---------|
| `index.html` | Entry point: semántico, carga CSS + JS al final del body |
| `css/styles.css` | Sistema de diseño responsive, SUIT CSS, estilos de formulario y resultado |
| `js/storage.js` | Wrapper localStorage con namespace, versionado, error handling |
| `js/categories.js` | Tabla AFIP default + CRUD + validación + import/export JSON |
| `js/calculator.js` | Funciones puras de liquidación (básico, antigüedad, suma NR, SAC) |
| `js/ui.js` | Renderizado DOM, formateo ARS, binding de eventos |
| `js/app.js` | Orquestador: init, state, handlers, conexión entre módulos |
| `data/afip-defaults.json` | (Opcional) copia de la tabla default para referencia/backup |

## Testing Strategy

| Capa | Qué probar | Cómo |
|------|------------|------|
| Unit (calculator) | Fórmulas contra escenarios del spec | Consola manual con datos de referencia AFIP |
| Integration | Flujo formulario → cálculo → resultado | Prueba manual: llenar formulario, verificar desglose |
| Validation | Campos inválidos, errores, edge cases | Probar horas=0, antigüedad>20, sin categoría |

## Open Questions

- [ ] ¿Incluir `data/afip-defaults.json` como archivo separado o embebido solo en categories.js? La propuesta lo lista pero el spec R1 dice "embedded default table" — se puede omitir el archivo y mantener solo el embed.
