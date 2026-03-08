# nuxt-remove-before-flight

[![CI](https://github.com/sefacndmr01/nuxt-remove-before-flight/actions/workflows/ci.yml/badge.svg)](https://github.com/sefacndmr01/nuxt-remove-before-flight/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/nuxt-remove-before-flight.svg)](https://www.npmjs.com/package/nuxt-remove-before-flight)
[![npm downloads](https://img.shields.io/npm/dm/nuxt-remove-before-flight.svg)](https://www.npmjs.com/package/nuxt-remove-before-flight)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/npm/l/nuxt-remove-before-flight.svg)](https://opensource.org/licenses/MIT)

A [Nuxt](https://nuxt.com) module that removes code marked with `// @remove-before-flight` during production build only. In development the marked code runs as usual; in build it is stripped from the bundle. Source files on disk are never changed, so git history stays clean.

Use this when you want to keep dev-only code (debug logs, mocks, feature flags) in the same codebase but exclude it from production bundles.

---

## Installation

1. Install the package (use one of the following):

    ```bash
    npm install nuxt-remove-before-flight
    # or
    pnpm add nuxt-remove-before-flight
    # or
    yarn add nuxt-remove-before-flight
    ```

2. Register the module in `nuxt.config.ts`:

    ```ts
    export default defineNuxtConfig({
        modules: ['nuxt-remove-before-flight'],
    })
    ```

---

## Usage

### Single line

Place `// @remove-before-flight` on one line. That line and the **next line** are removed at build time.

Example:

```ts
function init() {
    // @remove-before-flight
    console.log('Debug: only in dev')
    doRealInit()
}
```

After build, the result is equivalent to:

```ts
function init() {
    doRealInit()
}
```

### Block

Use two `// @remove-before-flight` lines to mark a block. Everything from the first marker up to and including the second marker is removed at build time.

Example:

```ts
function setup() {
    // @remove-before-flight
    if (import.meta.dev) {
        useFakeBackend()
    }
    // @remove-before-flight
    useRealBackend()
}
```

After build:

```ts
function setup() {
    useRealBackend()
}
```

Rules:

- Each pair of markers defines one block (first through second, inclusive).
- An odd, unpaired marker is treated as single-line: that line and the next are removed.

---

## Behavior

| Environment        | Effect on marked code                                      |
|--------------------|------------------------------------------------------------|
| Dev (`nuxt dev`)   | No removal; marked code runs as written.                  |
| Build (`nuxt build`)| Marked single lines and blocks are removed before bundling. |
| Git                | No file writes; nothing to commit from this module.        |

Removal is done in memory via a Vite transform that runs only during build. The repository always keeps the original source.

---

## Supported files

- **JS/TS:** `.ts`, `.js`, `.mjs`, `.cjs` — the whole file is processed.
- **Vue:** `.vue` — `<script>`, `<script setup>`, and `<template>` are processed. In templates use the HTML comment `<!-- @remove-before-flight -->` with the same single-line and block rules.

---

## Configuration

To turn the module off:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
    modules: ['nuxt-remove-before-flight'],
    removeBeforeFlight: {
        enabled: false,
    },
})
```

---

## Development

Commands for contributors:

- **Build the module:** `npm run build` — output is in `dist/`.
- **Run tests:** `npm run test` — runs Vitest once.
- **Run tests in watch mode:** `npm run test:watch`
- **Run the playground:** `npm run dev` — starts the Nuxt app in `playground/` using the local module.

---

## License

MIT
