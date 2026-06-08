# Electron — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Additional reference files

- [folder-structure.md](folder-structure.md) — process-oriented Electron folder layout and layering.
- [advanced-standards.md](advanced-standards.md) — advanced security, IPC, performance, and release standards.
- [security-performance-checklist.md](security-performance-checklist.md) — implementation and PR review checklist.

## Repository layout (desktop app)

```
src/main/           # window lifecycle, menus, privileged I/O
src/preload/        # contextBridge API only
src/renderer/       # React or static UI (no Node integration by default)
resources/
build/              # electron-builder / Forge config
```

**Rules**

- Renderer stays **unprivileged**; expose only named operations via preload.
- Keep **one IPC contract** document or typed module shared between main and renderer teams.

## Security reminders (non-negotiable)

- `contextIsolation: true`; avoid `nodeIntegration` in renderer.
- **CSP** on HTML; block unexpected navigation and window-open targets.
- Ship **current Electron** train; track security releases.

## Code examples

### Main: register handlers; broadcast progress

```javascript
import { ipcMain } from 'electron';

const ch = 'jobs:start';

export function registerJobHandlers(startJob) {
  ipcMain.removeHandler(ch);
  ipcMain.handle(ch, async (_evt, payload) => {
    if (!payload?.jobId) throw new Error('invalid_payload');
    return startJob(payload);
  });
}

export function broadcastProgress(win, jobId, pct) {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('jobs:progress', { jobId, pct });
}
```

### Preload (narrow surface)

```javascript
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

### Renderer: typed `window.app` sketch

```typescript
declare global {
  interface Window {
    app: {
      startJob: (payload: { jobId: string }) => Promise<{ accepted: boolean }>;
      onProgress: (cb: (v: { jobId: string; pct: number }) => void) => () => void;
    };
  }
}
```

