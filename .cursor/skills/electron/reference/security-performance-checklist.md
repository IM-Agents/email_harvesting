# Electron Security and Performance Checklist

Use this checklist during implementation and PR review.

## Security checklist

- [ ] `contextIsolation` enabled
- [ ] `nodeIntegration` disabled in renderer
- [ ] IPC channels are allowlisted and validated
- [ ] CSP is defined and production-safe
- [ ] Navigation/open-window protections are set
- [ ] No secrets exposed in renderer logs or storage

## Performance checklist

- [ ] No heavy sync work in main startup path
- [ ] High-volume IPC traffic batched or throttled
- [ ] Renderer routes/features lazy-loaded where useful
- [ ] Large file operations streamed when possible
- [ ] Memory usage checked across open/close window cycles

## Reliability checklist

- [ ] Graceful app shutdown behavior verified
- [ ] Auto-update tested in staged environment
- [ ] Crash reporting wired and validated
- [ ] Error boundaries present in renderer UI

## Packaging checklist

- [ ] Release artifacts signed
- [ ] Platform-specific settings reviewed (macOS notarization, Windows signing)
- [ ] Build reproducibility documented in CI

## Quick review prompt

When reviewing Electron code, ask:

1. Is this in the correct process (`main`, `preload`, `renderer`)?
2. Is this IPC channel minimal, validated, and necessary?
3. Could this block UI/main thread under real user load?
