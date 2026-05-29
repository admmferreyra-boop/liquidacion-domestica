# Tasks: App Liquidación Doméstica — MVP

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1070 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Delivery strategy | size:exception |
| Chain strategy | single-pr |

Decision needed before apply: Yes — resolved: size:exception approved
Chained PRs recommended: Yes (user chose size:exception)
Chain strategy: single-pr
400-line budget risk: High (accepted via size:exception)

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Foundation + Core Logic | PR 1 | Spec update, HTML, CSS, data, storage, categories, calculator (~680 lines) |
| 2 | UI + Orchestration + Verification | PR 2 | ui.js, app.js, manual tests (~390 lines) |

## Phase 1: Foundation

- [x] T1: Update `openspec/specs/salary-calculator/spec.md` and `openspec/specs/category-manager/spec.md` with correct AFIP mayo-2026 values, scenario expected outputs, and suma NR brackets
- [x] T2: Create `index.html` — semantic HTML5, meta viewport, load CSS + JS in dependency order
- [x] T3: Create `css/styles.css` — responsive SUIT CSS, 3 breakpoints, AFIP blue accent, form/card/table patterns, ARS monospace
- [x] T4: Create `data/afip-defaults.json` — AFIP table JSON mirroring embedded defaults for reference/backup

## Phase 2: Core Logic

- [x] T5: Create `js/storage.js` — localStorage wrapper: namespace `liquidacion-domestica:`, versioned schema, save/load/remove, exportAll/importAll, error handling (JSON corrupto, QuotaExceeded)
- [x] T6: Create `js/categories.js` — embedded AFIP 5-category table with mayo-2026 values, CRUD API (getAll, getById, update importJSON, exportJSON), validation (positive numbers, non-empty, schema), persistence via T5
- [x] T7: Create `js/calculator.js` — pure functions: calcularBasico (hora/mensual), calcularAntiguedad (1%/año, max 20%), calcularSumaNoRemunerativa (3 brackets), calcularSAC (proporcional), calcularSueldo; round(2), no side effects

## Phase 3: UI + Orchestration

- [x] T8: Create `js/ui.js` — renderForm, renderResults (desglose), renderCategoryTable (editable inline), ARS formatting ($X.XXX,XX), bindFormEvents with handler callbacks, error display
- [x] T9: Create `js/app.js` — coordinator: state object, init(), handlers (onCalcular, onCategoriaChange, onImportJSON, onExportJSON, onEditCategory), wires T5-T8

## Phase 4: Verification

- [x] T10: Manual test: 8 salary scenarios verified (basic hourly, basic monthly, antigüedad 3%/capped, zona desfavorable, suma NR 4 brackets, SAC 2/6 meses, vacaciones all brackets, cálculo completo) — ALL PASS via Node.js
- [x] T11: Persistent storage verified: save/load round-trip, namespace, version mismatch, corrupted JSON, remove, empty key rejection, multiple keys — ALL 9 tests PASS via Node.js
- [x] T12: CSS responsive verified: 3 breakpoints (374px/768px/1024px), mobile-first, AFIP blue #0072bc, SUIT CSS naming, overflow-x for category table, monospace amounts, print styles, error states, 15 checks ALL PASS

## Dependencies

```
T1 (spec update) — independent
T2 (index.html) — independent
T3 (css/styles.css) — independent
T4 (afip-defaults.json) — independent
T5 (storage.js) — independent
T6 (categories.js) → depends on T5
T7 (calculator.js) → depends on T6 (needs category schema)
T8 (ui.js) → depends on T2, T3 (needs DOM structure, CSS classes)
T9 (app.js) → depends on T5, T6, T7, T8 (connects everything)
T10, T11, T12 → depend on all above
```
