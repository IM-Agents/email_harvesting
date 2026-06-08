# Electron Advanced Standards

Advanced standards for security, performance, and release reliability.

## 1) Process boundary discipline

- Keep `main` process privileged and minimal.
- Keep `renderer` unprivileged; no direct Node APIs by default.
- Expose a narrowly scoped preload bridge.

## 2) IPC contract standards

- Prefer `ipcMain.handle`/`ipcRenderer.invoke` for request-response.
- Validate payloads on both preload and main edges.
- Return typed, deterministic response envelopes for predictable UI handling.

## 3) Security hardening

- `contextIsolation: true`, `sandbox: true` (when compatible), `nodeIntegration: false`.
- Define strict CSP; avoid `unsafe-inline` in production.
- Block unknown navigation and `window.open` targets.
- Keep Electron and Chromium versions updated promptly.

## 4) Performance standards

- Avoid blocking main thread with heavy CPU tasks.
- Offload CPU work to workers/utility processes.
- Batch high-frequency IPC messages; debounce where acceptable.
- Lazy-load heavy renderer routes/features.

## 5) Memory and lifecycle

- Dispose event listeners when windows close.
- Ensure IPC subscriptions return unsubscribe handlers.
- Track leaks from long-lived BrowserWindow references.

## 6) Release and distribution

- Sign binaries for each platform.
- Use staged rollout for auto-updates.
- Capture crash telemetry before broad rollout.

## 7) Storage standards

- Use `app.getPath('userData')` for persistent app data.
- Keep migration versioning for local schema/config changes.
- Avoid large critical data in renderer-only browser storage.

## 8) Example: validated IPC handler

```javascript
ipcMain.handle('settings:update', async (_evt, payload) => {
  const parsed = settingsSchema.parse(payload);
  await settingsService.update(parsed);
  return { ok: true };
});
```

## 9) Anti-patterns

- Exposing raw `ipcRenderer` to renderer window.
- Doing business logic directly in preload script.
- Loading untrusted remote content in privileged contexts.
