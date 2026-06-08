---
name: electron-standards
description: Electron desktop standards for process boundaries, IPC, security, packaging, and performance. Use when building or reviewing Electron apps, preload scripts, auto-update flows, or native integrations.

---

# Electron Standards

## 1. Process model

- **Main process:** window lifecycle, native menus, system integrations, privileged operations.
- **Renderer:** UI only; **no Node.js** in renderer unless `nodeIntegration` is explicitly required (discouraged).
- **Preload:** narrow, explicit `contextBridge.exposeInMainWorld` API surface; whitelist channels.

```javascript
// preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('app', {
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  onProgress: (cb) => {
    const listener = (_, v) => cb(v);
    ipcRenderer.on('job:progress', listener);
    return () => ipcRenderer.removeListener('job:progress', listener);
  },
});
```

## 2. IPC patterns

- Prefer **`invoke`/`handle`** for request/response; `send`/`on` for streaming events.
- **Validate messages** in main: schema-check payloads; ignore unknown channels.
- **Never pass raw file paths or secrets** to untrusted renderer content without validation.

```javascript
// main.js
import { ipcMain, dialog } from 'electron';

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] });
  if (canceled) return null;
  return filePaths[0];
});
```

## 3. Security checklist

- `contextIsolation: true`, `sandbox: true` (where compatible), **no** `nodeIntegration` in renderer.
- **CSP** for any loaded HTML; avoid `unsafe-inline` in production.
- **Navigate** events: block unexpected `will-navigate` / `setWindowOpenHandler` targets.
- Keep **Electron updated**; monitor CVEs.

## 4. Performance

- **Lazy-load** heavy renderer routes; split bundles per window if needed.
- Avoid **main-thread blocking** work; move CPU work to workers or child processes.
- Limit **IPC chatter**; batch state updates; debounce high-frequency events.

## 5. Window and resource management

- Dispose listeners on window close; cancel long jobs tied to `webContents`.
- Pool expensive native handles; cap concurrent background tasks.

## 6. Bundling and distribution

- Use **electron-builder** or **Forge** with signed artifacts per OS; notarize macOS builds.
- **Auto-update:** serve deltas over HTTPS; staged rollouts; crash telemetry before full release.
- **ASAR** integrity where supported; strip devtools from production builds.

## 7. Storage

- Use `app.getPath('userData')` for persisted files; migrate schemas with versioned filenames.
- SQLite/LevelDB in main or utility process—not ad hoc `localStorage` for large domain data unless scoped web app.

## Anti-patterns

- Exposing full `ipcRenderer` or `remote` to window.
- Loading arbitrary remote URLs in the same session as privileged APIs.
- Giant synchronous file reads on startup path in main.

## Cross-references

- Node patterns: [../nodejs/SKILL.md](../nodejs/SKILL.md)
- Reference (layout + examples): [reference/README.md](reference/README.md)
