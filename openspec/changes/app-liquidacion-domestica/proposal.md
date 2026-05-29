# Proposal: App Liquidación Doméstica — MVP

## Intent

Crear una SPA vanilla que liquide sueldos de empleadas domésticas según resoluciones AFIP. El proyecto está vacío — este primer change entrega la estructura base, el formulario de cálculo, y la gestión de categorías.

## Scope

### In Scope
- 5 categorías AFIP oficiales con valores hora default (mayo 2026)
- Cálculo líquido: básico + antigüedad (1%/año, máx 20%) + suma no remunerativa + SAC proporcional
- Formulario responsive (mobile incluido)
- Tabla AFIP editable inline + import/export JSON
- localStorage para configuración persistente

### Out of Scope
- Aportes/descuentos del empleado (post-MVP)
- Zona desfavorable 31% (post-MVP)
- Vacaciones / feriados / licencias
- Historial de múltiples liquidaciones
- Multi-empleada / dashboard
- Impresión PDF de recibos

## Capabilities

### New Capabilities
- `salary-calculator`: cálculo completo de liquidación (básico, antigüedad, suma NR, SAC)
- `category-manager`: CRUD de categorías AFIP, import/export JSON de tabla salarial
- `persistence-storage`: localStorage wrapper con versionado para configs y tabla actualizada

### Modified Capabilities
None (primera iteración del proyecto).

## Approach

SPA vanilla con separación modular: `app.js` (orquestador), `calculator.js` (fórmulas), `categories.js` (datos AFIP), `storage.js` (localStorage), `ui.js` (DOM). El formulario guía al usuario paso a paso: período → empleada → horas → adicionales → resultado desglosado. La tabla AFIP se embebe como JSON default y se persiste en localStorage tras cada edición.

```
index.html → app.js → ui.js (formulario)
                   ↘ calculator.js (cálculos)
                   ↘ categories.js (tabla AFIP) ↔ storage.js (localStorage)
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `index.html` | New | Entry point con estructura semántica |
| `css/styles.css` | New | Sistema de diseño responsive, SUIT CSS |
| `js/app.js` | New | Orquestador de módulos |
| `js/calculator.js` | New | Lógica de liquidación |
| `js/categories.js` | New | Datos y gestión de categorías AFIP |
| `js/storage.js` | New | Wrapper localStorage con versionado |
| `js/ui.js` | New | Manipulación DOM, eventos, renderizado |
| `data/afip-defaults.json` | New | Tabla de valores AFIP default |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Tabla AFIP desactualizada | High | Editor inline + import JSON; valores default embeddados, sobreescribibles |
| Pérdida de datos localStorage | Low | Export JSON descargable como backup |
| Redondeo inconsistente | Med | `Math.round()` con 2 decimales en cada operación |
| Cálculo SAC sin historial | Med | Usar salario actual como estimación; aclarar en UI |

## Rollback Plan

1. Restaurar `data/afip-defaults.json` original si se corrompió la tabla
2. Limpiar localStorage: `localStorage.removeItem('afip-rates')` para recargar defaults
3. Revertir commits si el cambio está en Git (primer change, sin historial previo)

## Dependencies

Ninguna. Stack 100% vanilla, sin build, sin dependencias externas.

## Success Criteria

- [ ] Formulario completo: carga categorías AFIP, calcula líquido, muestra desglose
- [ ] Validación manual: 3 casos de prueba contra calculadora oficial AFIP
- [ ] Responsive: funciona sin scroll horizontal en viewport 375px (iPhone SE)
- [ ] Tabla editable: modificar valor hora, guardar, recargar página, ver valor persistido
- [ ] Import/export JSON: descargar tabla, modificar, reimportar, ver cambios reflejados
