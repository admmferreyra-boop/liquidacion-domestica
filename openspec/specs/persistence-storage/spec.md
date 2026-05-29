# Persistence Storage Specification

**Version**: 1.0
**Domain**: persistence-storage
**Stack**: HTML5 + CSS3 + JS (ES6+) vanilla — sin build, sin dependencias

## Purpose

Wrapper typed around `localStorage` con versionado de schema, migración automática, y respaldo a defaults ante errores. Es el único punto de acceso al storage para el resto de la aplicación.

## Requirements

### R1: Namespace y Claves

The system MUST namespace all keys under a single prefix `liquidacion-domestica:` to avoid collisions with other apps using the same origin.

#### Scenario: Keys namespaced

- GIVEN `storage.save('afipRates', data)`
- WHEN se guarda
- THEN localStorage MUST contener la key `liquidacion-domestica:afipRates`

### R2: Save / Load / Remove

The system MUST provide `save(key, data)`, `load(key)`, and `remove(key)` operations.

#### Scenario: Save and Load round-trip

- GIVEN `storage.save('afipRates', { categorias: [...] })`
- WHEN `storage.load('afipRates')`
- THEN MUST devolver el objeto guardado exacto

#### Scenario: Remove restaura default

- GIVEN `storage.remove('afipRates')`
- WHEN `storage.load('afipRates')`
- THEN MUST devolver el default embebido (no null)

#### Scenario: Load con key inexistente

- GIVEN no hay datos guardados para `configLast`
- WHEN `storage.load('configLast')`
- THEN MUST devolver el default definido para esa key

### R3: Versionado de Schema

The system MUST store a schema version integer alongside all data and reject loads with version mismatch.

#### Scenario: Version match → carga exitosa

- GIVEN stored data con `version: 1`
- WHEN `storage.load('afipRates')` con current schema version = 1
- THEN MUST devolver los datos almacenados

#### Scenario: Version mismatch → resetea a default

- GIVEN stored data con `version: 0` (obsoleto)
- WHEN `storage.load('afipRates')` con current schema version = 1
- THEN MUST descartar stored data
- THEN MUST devolver default embebido

### R4: Manejo de Errores

The system MUST gracefully handle all localStorage failure modes without crashing the app.

#### Scenario: JSON corrupto en localStorage

- GIVEN localStorage contiene `"not-json"` para key `configLast`
- WHEN `storage.load('configLast')`
- THEN MUST capturar el SyntaxError
- THEN MUST devolver default
- THEN MUST llamar `console.warn` con mensaje descriptivo

#### Scenario: QuotaExceededError

- GIVEN localStorage lleno (> 5MB)
- WHEN `storage.save('afipRates', data)`
- THEN MUST capturar el QuotaExceededError
- THEN MUST invocar callback de error configurable
- THEN los datos en storage MUST preservar su estado anterior

### R5: Export / Backup

The system SHOULD provide `exportAll()` to retrieve all stored data as a single serializable object, and `importAll(data)` to restore it.

#### Scenario: Export completo

- GIVEN datos guardados en múltiples keys
- WHEN `storage.exportAll()`
- THEN MUST devolver objeto con todas las keys + versión
- THEN el objeto SHOULD ser serializable a JSON sin pérdida

## Stored Schema

| Key | Tipo | Default | Propósito |
|-----|------|---------|-----------|
| `afipRates` | object | Tabla AFIP embebida | Categorías y valores actualizados |
| `configLast` | object \| null | null | Última liquidación calculada |
| `appSettings` | object | `{}` | Preferencias de UI (tema, etc.) |

## Validation Rules

| Condición | Comportamiento |
|-----------|---------------|
| JSON corrupto | Fallback a default + console.warn |
| Version mismatch | Fallback a default |
| QuotaExceeded | Callback error + preservar estado |
| Key no existe | Devolver default |
| key vacía | MUST rechazar con TypeError |
