# Electron Folder Structure

Recommended structure for maintainable Electron desktop applications.

## Standard layout

```text
src/
  main/                 # BrowserWindow lifecycle, menus, auto-update, native APIs
    ipc/                # ipcMain handlers per domain
    windows/            # window factory and lifecycle helpers
    services/           # privileged operations (fs, system integrations)
  preload/              # contextBridge API contracts only
  renderer/             # UI app (React/Vue/static), no direct Node access
    app/
    features/
    shared/
resources/              # icons, native assets
build/                  # electron-builder/forge config
scripts/                # packaging and release scripts
```

## Monorepo layout

```text
apps/
  desktop/
    src/...
packages/
  ui-kit/
  shared-types/         # IPC types, DTOs
```

## Layering rules

- `renderer` calls only `window.app.*` APIs exposed by preload.
- `preload` is a thin bridge and validation layer, not business logic.
- `main` owns privileged operations and OS integrations.
- IPC handlers in `main/ipc` delegate to service modules.

## Naming conventions

- IPC channel names: scoped and explicit (`file:open`, `jobs:start`).
- Preload API methods: verbs (`openFile`, `startJob`, `getSettings`).
- Folder names: `kebab-case` or lowercase (consistent repo-wide).

## Why this structure

- Clear trust boundary between privileged and unprivileged code.
- Better testability and safer IPC evolution.
- Easier onboarding and AI-generated code consistency.
