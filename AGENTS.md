# Liquidación Doméstica — AGENTS.md

## Project Overview

App web liviana (HTML + CSS + JS vanilla) para liquidar sueldos de empleadas
domésticas en Argentina. Calcula el salario en base a horas trabajadas, valor
hora (según categoría AFIP), antigüedad, y conceptos adicionales.

## Stack

| Layer | Tech |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) vanilla |
| Runtime | Cualquier browser moderno — sin build, sin dependencias |
| Storage | `localStorage` para persistir configuraciones |

## Architecture

Single-page application con módulos JS separados por responsabilidad:

```
/
├── index.html          # Entry point
├── css/
│   └── styles.css      # Estilos
├── js/
│   ├── app.js          # Coordinador / controlador
│   ├── calculator.js   # Lógica de liquidación
│   ├── categories.js   # Categorías y valores AFIP
│   ├── storage.js      # localStorage
│   └── ui.js           # Manipulación del DOM
├── data/
│   └── afip-defaults.json  # Tabla de valores AFIP default
└── AGENTS.md
```

## Conventions

- **Nombres**: `kebab-case` para archivos, `camelCase` para funciones/variables JS
- **Clases CSS**: `suit-case` (Componente--modificador)
- **JS Modules**: usar IIFE o module pattern — sin bundlers
- **Comentarios**: solo cuando el código no es obvio. Nada de `// suma total`
- **Sin librerías externas**: ni jQuery, ni React, ni Tailwind. CSS vanilla
- **Responsive**: que funcione en mobile (CUIT, consultas rápidas desde el celu)

## Valores AFIP

La app debe traer valores por default de la tabla oficial de empleadas
domésticas (personal de casas particulares), pero permitir editarlos
manualmente o importar una tabla nueva. Datos clave:

- **Categorías**: Supervisor/a, Personal con tareas específicas, Caseros/as,
  Asistencia y cuidados de personas, Personal para tareas generales
- **Valor hora**: según categoría y modalidad (con/sin retiro)
- **Antigüedad**: 1% por año trabajado (máximo 20% según convenio)
- **Actualizaciones**: AFIP actualiza trimestralmente; la app debe facilitar
  la actualización manual de la tabla

## SDD Settings

- `strict_tdd: false` (sin test runner por ahora)
- Live server: usar cualquier extensión VS Code (Live Server) o Python
  `http.server` para desarrollo local
- Primer change: estructura base + cálculo principal
- Review y validación manual (comparar con calculadoras oficiales)
