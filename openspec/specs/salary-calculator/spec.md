# Salary Calculator Specification

**Version**: 1.0
**Domain**: salary-calculator
**Stack**: HTML5 + CSS3 + JS (ES6+) vanilla — sin dependencias, sin build

## Purpose

Calcular el sueldo líquido de empleadas domésticas según categorías y resoluciones AFIP vigentes. Manejo de básico, antigüedad, sumas no remunerativas y SAC proporcional.

## Requirements

### R1: Cálculo de Básico

The system MUST compute basic salary from AFIP rate table (`category-manager`).

- **Por hora** (< 24h semanales): `básico = valor_hora × horas_mes`
- **Mensual** (≥ 24h semanales): `básico = valor_mensual`

#### Scenario: Cálculo por hora

- GIVEN cat5 con retiro, valor_hora $3.547,45, 120h/mes
- WHEN se calcula básico
- THEN $425.694,00

#### Scenario: Cálculo mensual

- GIVEN cat1 sin retiro, valor_mensual $585.432,62
- WHEN se selecciona modalidad mensual
- THEN básico = $585.432,62

#### Scenario: Horas cero

- GIVEN horas_trabajadas = 0
- WHEN se solicita calcular
- THEN error "Las horas trabajadas deben ser mayor a cero"

### R2: Antigüedad

The system MUST add 1%/year seniority (capped at 20%): `básico × MIN(años, 20) / 100`.

#### Scenario: Normal

- GIVEN básico $425.694,00, 3 años
- WHEN calcula antigüedad
- THEN $12.770,82 (3%)

#### Scenario: Tope 20%

- GIVEN básico $425.694,00, 25 años
- WHEN calcula antigüedad
- THEN $85.138,80 (capped)

### R3: Suma No Remunerativa

The system MUST add fixed non-remunerative amount per weekly hours bracket:

| Brackets | Monto |
|----------|-------|
| ≤ 12h/sem | $4.000 |
| 12– < 16h/sem | $5.750 |
| ≥ 16h/sem | $10.000 |

#### Scenario: Por rango horario

- GIVEN 15h semanales
- WHEN calcula suma NR
- THEN $5.750

#### Scenario: Rango máximo

- GIVEN 20h semanales
- WHEN calcula suma NR
- THEN $10.000

### R4: SAC (Aguinaldo) Proporcional

The system MUST calculate proportional SAC: `(mejor_salario_mensual / 2) × (meses_trabajados / 6)`. Usar salario actual como estimación si no hay historial.

#### Scenario: 6 meses

- GIVEN básico + antigüedad = $500.000, 6 meses
- WHEN calcula SAC
- THEN $250.000

#### Scenario: 2 meses

- GIVEN básico + antigüedad = $500.000, 2 meses
- WHEN calcula SAC
- THEN $83.333,33

### R5: Redondeo y Desglose

The system MUST round all values to 2 decimal places (`Math.round(v * 100) / 100`) and display breakdown: básico, antigüedad, suma NR, SAC, total.

#### Scenario: Redondeo

- GIVEN 83.333,333...
- WHEN se redondea
- THEN $83.333,33

#### Scenario: Desglose

- GIVEN cálculo completo
- WHEN se muestran resultados
- THEN cada línea MUST mostrar concepto, monto, subtotal

## Input / Output

| Input | Tipo | Rango | Output | Tipo |
|-------|------|-------|--------|------|
| mes | int | 1–12 | basico | float(2) |
| año | int | ≥ 2026 | antiguedad | float(2) |
| categoría | int | 1–5 | suma_no_remunerativa | float(2) |
| modalidad | string | con/sin retiro | sac | float(2) |
| horas_trabajadas | int | 1–744 | total | float(2) |
| antigüedad_años | int | 0–50 | | |
| meses_trabajados | int | 1–6 | | |

## Validation

| Campo | Regla |
|-------|-------|
| horas_trabajadas | MUST be 1–744, entero |
| antigüedad_años | MUST be 0–50 |
| categoría | MUST be 1–5 |
| modalidad | MUST be "con-retiro" o "sin-retiro" |
