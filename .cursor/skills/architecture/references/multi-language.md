# Multi-Language Turborepo Reference

Turborepo isn't limited to JS/TS. Any task that's a `package.json` script can be
orchestrated by Turbo. This lets you colocate Python, Go, Rust, shell scripts, Docker
builds, and more in the same monorepo with shared caching.

---

## Python Package in a Turbo Repo

### `packages/ml-service/package.json`
```json
{
  "name": "@repo/ml-service",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build":     "pip install -r requirements.txt",
    "dev":       "python src/main.py",
    "test":      "pytest tests/ -v",
    "lint":      "ruff check src/",
    "typecheck": "mypy src/",
    "clean":     "find . -type d -name __pycache__ | xargs rm -rf"
  }
}
```
> `package.json` is just a script bridge — the real code is Python. No Node runtime is used.

### Python package layout
```
packages/ml-service/
├── package.json       ← Turbo entry point
├── requirements.txt
├── pyproject.toml     ← optional
├── src/
│   ├── __init__.py
│   └── main.py
└── tests/
    └── test_main.py
```

### `turbo.json` for Python tasks
```jsonc
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs":  ["requirements.txt", "pyproject.toml"],
      "outputs": [".venv/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs":  ["src/**/*.py", "tests/**/*.py"],
      "outputs": [".pytest_cache/**", "htmlcov/**"]
    }
  }
}
```

---

## Go Package in a Turbo Repo

### `apps/go-api/package.json`
```json
{
  "name": "go-api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "go build -o bin/server ./cmd/server",
    "dev":   "go run ./cmd/server",
    "test":  "go test ./...",
    "lint":  "golangci-lint run",
    "clean": "rm -rf bin/"
  }
}
```

### Go package layout
```
apps/go-api/
├── package.json
├── go.mod
├── go.sum
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   └── handlers/
└── bin/           ← build output (gitignored)
```

### `turbo.json` outputs for Go
```jsonc
{
  "tasks": {
    "build": {
      "inputs":  ["**/*.go", "go.mod", "go.sum"],
      "outputs": ["bin/**"]
    }
  }
}
```

---

## Rust Package in a Turbo Repo

### `apps/rust-cli/package.json`
```json
{
  "name": "rust-cli",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "cargo build --release",
    "dev":   "cargo run",
    "test":  "cargo test",
    "lint":  "cargo clippy",
    "clean": "cargo clean"
  }
}
```

### `turbo.json` for Rust
```jsonc
{
  "tasks": {
    "build": {
      "inputs":  ["src/**/*.rs", "Cargo.toml", "Cargo.lock"],
      "outputs": ["target/release/**"]
    }
  }
}
```
> Rust's `target/` directory is large — consider whether to cache it in Turbo remote cache or rely on Cargo's own caching.

---

## Shell / Script Package

### `packages/scripts/package.json`
```json
{
  "name": "@repo/scripts",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build":  "bash scripts/build.sh",
    "deploy": "bash scripts/deploy.sh",
    "clean":  "bash scripts/clean.sh"
  }
}
```

---

## Docker Build as a Turbo Task

### `apps/docker-service/package.json`
```json
{
  "name": "docker-service",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "docker build -t my-service:latest .",
    "dev":   "docker compose up",
    "clean": "docker rmi my-service:latest || true"
  }
}
```

### `turbo.json` — disable cache for Docker (image is its own cache)
```jsonc
{
  "tasks": {
    "build": {
      "inputs":  ["Dockerfile", "src/**"],
      "outputs": [],
      "cache": false
    }
  }
}
```

---

## Mixed-Language Monorepo Full Example

```
my-monorepo/
├── apps/
│   ├── web/           ← Next.js (TypeScript)
│   ├── api/           ← Express (TypeScript)
│   ├── go-gateway/    ← Go microservice
│   └── ml-pipeline/   ← Python (ML)
├── packages/
│   ├── ui/            ← React components (.tsx)
│   ├── utils/         ← Shared helpers (.ts)
│   ├── types/         ← Shared types (.d.ts)
│   └── config/        ← tsconfig, eslint
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### Root `turbo.json` for mixed repo
```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "bin/**", ".next/**", "target/release/**", ".venv/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**", "htmlcov/**"]
    },
    "lint": {},
    "clean": { "cache": false }
  }
}
```

---

## Non-JS Language Tips

1. **Always define `inputs`** precisely — Turbo can't auto-detect non-JS file changes.
2. **Set `outputs`** to the build artifacts so they get cached and restored on cache hits.
3. **Use `"cache": false`** for tasks where the side effect IS the work (Docker push, deploy).
4. **`persistent: true`** for long-running dev processes (watchers, servers).
5. **Ensure the runtime is installed** in CI — Turbo won't install Python/Go/Rust for you.
6. **Filter by package** when working in one language: `turbo run build --filter=go-gateway`

---

## `.turbo/config.json` (optional team config)

```json
{
  "teamId": "your-vercel-team-id",
  "apiUrl": "https://api.vercel.com"
}
```
Commit this if the whole team should share remote cache. Keep `TURBO_TOKEN` in secrets.
