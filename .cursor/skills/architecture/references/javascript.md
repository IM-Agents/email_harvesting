# JavaScript App & Package Templates (.js, .mjs, .cjs)

Use this when the user wants a pure-JS package with no TypeScript compilation step.

---

## Dependency versions

- **MUST** install **latest stable** releases when scaffolding (`npm install <package>@latest`).
- Example `package.json` blocks use `"latest"` as a placeholder—not pinned semver ranges.
- After bootstrap, lock versions in your lockfile and refresh with `npm outdated` / Renovate as needed.

---

## JavaScript ESM Library (`packages/utils`)

### `packages/utils/package.json`
```json
{
  "name": "@repo/utils",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main":   "./src/index.js",
  "module": "./src/index.js",
  "exports": {
    ".": {
      "import": "./src/index.js"
    }
  },
  "scripts": {
    "lint":  "eslint src/",
    "test":  "vitest run",
    "clean": "echo nothing to clean"
  },
  "devDependencies": {
    "eslint": "latest",
    "vitest": "latest"
  }
}
```
> Pure JS libraries that don't need transpilation can skip a build step entirely — just export from `src/`.

### `packages/utils/src/index.js`
```js
/**
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * @template T
 * @param {T[]} arr
 * @param {(item: T) => boolean} predicate
 * @returns {T[]}
 */
export function filterUnique(arr, predicate) {
  return arr.filter(predicate);
}
```
> Use JSDoc annotations for editor IntelliSense without TypeScript.

---

## JavaScript CJS Library

### `packages/helpers/package.json`
```json
{
  "name": "@repo/helpers",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.cjs",
  "exports": {
    ".": {
      "require": "./src/index.cjs"
    }
  },
  "scripts": {
    "lint":  "eslint src/",
    "clean": "echo ok"
  }
}
```

### `packages/helpers/src/index.cjs`
```js
'use strict';

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { sleep };
```

---

## Dual ESM + CJS (Without TypeScript)

Use `rollup` or `tsup` (supports JS-in, JS-out) to produce both formats:

### `packages/shared/package.json`
```json
{
  "name": "@repo/shared",
  "version": "0.0.1",
  "private": true,
  "main":   "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "exports": {
    ".": {
      "import":  "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "scripts": {
    "build": "rollup -c",
    "dev":   "rollup -c --watch",
    "clean": "rm -rf dist"
  },
  "devDependencies": {
    "rollup": "latest",
    "@rollup/plugin-node-resolve": "latest"
  }
}
```

### `packages/shared/rollup.config.mjs`
```js
import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.js",
  output: [
    { file: "dist/index.cjs", format: "cjs" },
    { file: "dist/index.mjs", format: "esm" }
  ],
  plugins: [resolve()],
  external: [] // list peer deps here
};
```

---

## JavaScript React App (`apps/web`) — webpack

### `apps/web/package.json` (webpack + React)
```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev":   "webpack serve --mode development",
    "build": "webpack --mode production",
    "lint":  "eslint src/",
    "test":  "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/ui":         "*",
    "@repo/utils":      "*",
    "react":            "latest",
    "react-dom":        "latest",
    "react-router-dom": "latest"
  },
  "devDependencies": {
    "@babel/core":             "latest",
    "@babel/preset-env":       "latest",
    "@babel/preset-react":     "latest",
    "babel-loader":            "latest",
    "css-loader":              "latest",
    "style-loader":            "latest",
    "html-webpack-plugin":     "latest",
    "mini-css-extract-plugin": "latest",
    "webpack":                 "latest",
    "webpack-cli":             "latest",
    "webpack-dev-server":      "latest",
    "eslint":                  "latest"
  }
}
```

> Full `webpack.config.js` and `babel.config.js` — see Variant D in `react-node-structure.md` (webpack **latest**, css-loader **latest**).

---

## JavaScript Node App (`apps/api`)

### `apps/api/package.json`
```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "echo no build needed for JS",
    "dev":   "node --watch src/index.js",
    "start": "node src/index.js",
    "lint":  "eslint src/",
    "clean": "echo ok"
  },
  "dependencies": {
    "@repo/utils": "*",
    "express": "latest"
  },
  "devDependencies": {
    "eslint": "latest"
  }
}
```

### `apps/api/src/index.js`
```js
import express from "express";
import { capitalize } from "@repo/utils";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.get("/", (req, res) => {
  res.json({ message: capitalize("hello world") });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
```

---

## ESLint Shared Config (JS)

### `packages/config/eslint.config.mjs`
```js
export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off"
    }
  }
];
```

Each app/package extends:
```js
// apps/web/eslint.config.mjs
import baseConfig from "@repo/config/eslint.config.mjs";
export default [...baseConfig];
```
