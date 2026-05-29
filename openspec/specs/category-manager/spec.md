# Category Manager Specification

**Version**: 1.0
**Domain**: category-manager
**Stack**: HTML5 + CSS3 + JS (ES6+) vanilla — sin dependencias, sin build

## Purpose

Gestionar la tabla de categorías AFIP de empleadas domésticas: tabla default embebida, edición inline, importación y exportación JSON. Persiste via `persistence-storage`.

## Requirements

### R1: Tabla Default y Visualización

The system MUST ship with an embedded default table of 5 AFIP categories × 2 modalities (con/sin retiro) with May 2026 rates, displayed in a table with columns: categoría, descripción, modalidad, valor hora, valor mensual.

#### Scenario: Carga inicial

- GIVEN primera visita, sin datos en storage
- WHEN se carga la página
- THEN MUST mostrar 5 categorías con valores hora y mensual default

### R2: Edición Inline

The system MUST allow editing any rate value (hourly or monthly) directly in the UI, updating the view and persisting via `persistence-storage`.

#### Scenario: Editar valor hora

- GIVEN cat5 con retiro, valor_hora $3.547,45
- WHEN usuario cambia a $3.700,00
- THEN vista MUST reflejar el nuevo valor
- THEN storage MUST persistir

### R3: Validación de Valores

The system MUST reject empty, negative, zero, or non-numeric rate values.

#### Scenario: Valor negativo

- GIVEN editor inline para valor_hora
- WHEN usuario ingresa "-100"
- THEN MUST mostrar error "El valor debe ser un número positivo"
- THEN valor original MUST permanecer

#### Scenario: Valor vacío

- GIVEN editor inline
- WHEN usuario confirma campo vacío
- THEN MUST mostrar error "El valor no puede estar vacío"

### R4: Importación JSON

The system MUST allow importing a JSON file to replace the current category table.

#### Scenario: Import exitoso

- GIVEN archivo JSON válido con schema correcto
- WHEN usuario selecciona archivo
- THEN tabla MUST reemplazarse y storage MUST actualizarse

#### Scenario: JSON inválido

- GIVEN archivo con JSON mal formado
- WHEN usuario intenta importar
- THEN MUST mostrar error "El archivo no contiene JSON válido"
- THEN tabla actual MUST preservarse

#### Scenario: Schema incorrecto

- GIVEN JSON válido pero sin campo `categorias`
- WHEN usuario importa
- THEN MUST mostrar error con campo faltante
- THEN tabla MUST preservarse

### R5: Exportación JSON

The system MUST allow downloading the current table as `afip-rates.json`.

#### Scenario: Exportar

- GIVEN tabla actual cargada (default o modificada)
- WHEN usuario hace clic en "Exportar"
- THEN MUST descargar archivo JSON con schema completo

## Input / Output Schema

```json
{
  "version": 1,
  "categorias": [{
    "id": 1,
    "nombre": "Supervisora",
    "descripcion": "Coordinación y control",
    "modalidades": {
      "con_retiro": { "valor_hora": 4233.82, "valor_mensual": 528158.40 },
      "sin_retiro": { "valor_hora": 4614.42, "valor_mensual": 585432.62 }
    }
  }]
}
```

## Validation Rules

| Campo | Regla |
|-------|-------|
| `categorias` | MUST be non-empty array |
| `categorias[].id` | MUST be 1–5, unique |
| `categorias[].nombre` | MUST be non-empty string |
| `valor_hora` | MUST be float > 0 |
| `valor_mensual` | MUST be float > 0 |
| `version` | MUST be int ≥ 1 |
