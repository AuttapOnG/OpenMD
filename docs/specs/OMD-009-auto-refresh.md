# Spec: Auto-refresh on save (preview panel + browser)

**Status:** approved
**Date:** 2026-07-08
**Feature:** OMD-009 (builds on OMD-008)

## Goal
When the user saves a Markdown file, the preview panel updates immediately and
the browser preview reloads itself within 1-2 seconds, preserving scroll
position.

## Background
Both previews are static snapshots today: the user must re-run the command to
see changes. A WebSocket-based Live Server (v0.0.3) was reverted for
complexity. Pages opened via `file://` cannot poll for changes (browsers block
fetch on file URLs), so browser auto-refresh requires serving over localhost.

## Requirements
- [ ] Preview panel: track the previewed file's URI; on
      `onDidSaveTextDocument` for that file, re-render the webview
- [ ] Add `PreviewServer` using Node's built-in `http` module only — no new
      dependencies, no WebSocket
- [ ] "Open in Browser" opens `http://127.0.0.1:<port>/<mirror-path>.html`
      instead of a `file://` temp file; the server renders Markdown on demand
      and serves `.temp/assets/`
- [ ] `GET /mtime?f=<path>` returns the source file's last-modified time; the
      page polls it every 1 s and on change saves scroll position to
      sessionStorage, reloads, and restores scroll
- [ ] Server starts lazily on first "Open in Browser", binds to 127.0.0.1
      only, listens on port 0 (OS-assigned), and stops on deactivate

## Out of Scope
- Incremental DOM patching / no-reload updates (WebSocket approach)
- Refresh triggered by unsaved edits (only on save)
- Serving files outside the workspace or to non-localhost clients

## Success Criteria
- Edit + save a previewed file: panel updates instantly; browser tab reloads
  within 2 s with scroll position preserved
- Two VS Code windows can use the feature simultaneously (no port conflict)
- If the server cannot start, the command falls back to the v1.0.0 temp-file
  behavior and shows a warning
- Deleting the previewed file stops polling without errors in the browser

## Open Questions
- None
