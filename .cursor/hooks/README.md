# ClickUp session hooks

Posts a ClickUp task comment on these Cursor events:

| Event | When it runs | Comment |
|-------|----------------|---------|
| `sessionStart` | New Agent chat opened | Session started |
| `beforeSubmitPrompt` | First (and each) user message — **backup** if `sessionStart` did not run | Session started (once per `session_id`) |
| `stop` | Agent finishes a run | Agent run finished (+ **backfills** Session started if missing) |
| `sessionEnd` | Entire chat/session closed | Session ended (+ backfills Session started if missing) |

**Session start + end:** You should see **Session started** when you **send a message** (`beforeSubmitPrompt`) and **Session ended** when you **close the chat** (`sessionEnd`).

**Important:** A normal message like “create index.html” does **not** call `sessionEnd`. It calls **`stop`** when the agent completes that run.

### Why “Session started” sometimes looked broken

| Cause | What happens |
|-------|----------------|
| **`sessionStart` not fired** | Cursor often never runs this hook (see Settings → Hooks). There is **no** `phase=start` line in `clickup-last-run.log`. |
| **Stop ran before your next message** | An older version marked “start posted” when `stop` backfilled, so **`beforeSubmitPrompt` skipped** the real start comment. Fixed: prompt and stop use **separate flags**; `stop` resets the prompt flag for the **next** message. |
| **Same chat for days** | `session_id` is usually the **whole conversation id** — you only get one “Session started” per chat unless you send a new message after each agent `stop`. |

After updating the hook script, send a **new message** (or delete `.cursor/hooks/.clickup-session-state.json` once) and check the log for `OK posted start (prompt/prompt)`.

## Setup

1. **Config file** — Copy the example next to this README:

   ```text
   .cursor/hooks/clickup.config.example.json  →  .cursor/hooks/clickup.config.json
   ```

   Do **not** commit `clickup.config.json` if it contains your real token (add to `.gitignore`).

2. **API token** — Use **one** of:

   | Source | Notes |
   |--------|--------|
   | `CLICKUP_API_TOKEN` env | Recommended — [ClickUp → Settings → Apps](https://app.clickup.com/settings/apps) (`pk_...`) |
   | `clickup.config.json` → `apiToken` | Same key as in `clickup.config.example.json` |

   Restart Cursor after setting environment variables.

3. **Task ID** — Use **one** of (first match wins):

   | Priority | Source | Example |
   |----------|--------|---------|
   | 1 | `CLICKUP_TASK_ID` env | `3638847` |
   | 2 | Root **`process.md`** → `- **clickup_task**:` | `- **clickup_task**: 3638847` |
   | 3 | `clickup.config.json` → `taskId` | `"taskId": "3638847"` |
   | 4 | Git branch | `feat/CU-abc123-login` |

   Example `process.md` at repo root (use this **exact** key name):

   ```markdown
   ## Task Information
   - **clickup_task**: 3638847/ACC-30296
   ```

   Formats:
   - `86abc123` — internal ClickUp task id
   - `3638847/ACC-30296` — **team_id / custom task id** (auto-enables `customTaskIds`)

   The hook reads only the value after **`clickup_task`** on that line.

4. **Custom task IDs** — If your team uses custom IDs instead of ClickUp’s internal id:

   ```json
   {
     "taskId": "DEV-42",
     "customTaskIds": true,
     "teamId": "12345678"
   }
   ```

   `teamId` is your Workspace ID.

## Verify

1. Open **Cursor Settings → Hooks** and confirm `sessionStart`, `beforeSubmitPrompt`, `stop`, and `sessionEnd` are listed without errors.
2. Ensure root `process.md` has `- **clickup_task**: <id>` (or config/env as above).
3. Set **CLICKUP_API_TOKEN** (or `apiToken` in `clickup.config.json`) — without this, hooks **silently skip** (no comment).
4. Start a new Agent chat → “Session started” on the task.
5. Ask the agent to do work (e.g. create `index.html`) and wait until it **finishes** → “Agent run finished” (`stop`).
6. Close the chat → “Session ended” (`sessionEnd`).

Check **View → Output → Hooks** if nothing appears—you should see `posted stop comment` or `skipped — CLICKUP_API_TOKEN`.

Check the **Hooks** output channel if comments do not appear.

**Debug log (always written):** `.cursor/hooks/clickup-last-run.log`

**Manual test:**

```powershell
cd "d:\AI WORK\09_05_skill_cursor"
$env:CURSOR_PROJECT_DIR = (Get-Location).Path
$env:CLICKUP_API_TOKEN = "pk_your_token"
node .cursor/hooks/clickup-test.js
```

Look for `OK posted` in the terminal or `FAIL` with API error in the log file.

## Requirements

- Cursor **v2.4+** (older builds rejected `sessionStart` / `sessionEnd`).
- **Node.js** on `PATH` (for `node hooks/clickup-session.js`).

Hooks fail open: missing token or task id logs a message and does not block the session.
