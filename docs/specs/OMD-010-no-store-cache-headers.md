# OMD-010: Cache-Control: no-store on preview server dynamic responses

**Status:** approved (user confirmed in chat, 2026-07-10)

## Problem
`PreviewServer` renders every page fresh from disk, but its HTTP responses
carry no cache headers. A browser may heuristically cache the HTML or the
`/mtime` JSON, causing stale previews or a broken live-reload loop.

## Solution
Send `Cache-Control: no-store` on the two dynamic response types in
`src/server.ts`:
- rendered HTML pages (registered `.md` pages)
- `/mtime` JSON responses

Static assets under `/assets/` are immutable vendored files and keep their
current behavior (no cache headers).

## Acceptance criteria
1. HTML page responses include `Cache-Control: no-store`.
2. `/mtime` responses include `Cache-Control: no-store`.
3. `/assets/` responses are unchanged (no `Cache-Control` header).
4. Unit tests assert all three; `npm run compile` and the full test suite pass.

## Out of scope
Client-side markdown rendering (considered and rejected — server already
renders fresh per request; re-architecture not justified).
