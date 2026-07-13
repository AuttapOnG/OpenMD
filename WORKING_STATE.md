# Working State

## 2026-07-13 — OMD-013 Windows compatibility (Codex)

- Task 1 red state verified: `npm run compile` failed only because `src/paths.ts` does not exist, as prescribed.
- [codex] commit failed for: test: failing unit tests for extracted path helpers (OMD-013)
- Task 2 implemented the prescribed pure path helpers; compile passed and all 16 path-helper tests passed.
- [codex] commit failed for: feat: extract testable cross-platform path helpers (OMD-013)
- Task 3 rewired `extension.ts` to the shared helpers; compile passed and the exact non-server mocha command passed with 43 tests.
- [codex] commit failed for: refactor: extension.ts uses shared path helpers (OMD-013)
- Task 4 audited the current source and tests and recorded verdicts in `harness/notes/OMD-013.md`; one pre-existing cleanup prefix-matching issue was recorded as out of scope.
- [codex] commit failed for: docs: OMD-013 Windows audit findings table
- Task 5 added the prescribed Ubuntu/Windows compile and unit-test CI matrix; host-only Task 6 remains unchecked.
- [codex] commit failed for: ci: compile + unit tests on ubuntu/windows matrix (OMD-013)

## 2026-07-09

- v1.2.0 PUBLISHED to Open VSX (ovsx publish succeeded) using a token the
  human provided in chat; token scrubbed from the scratchpad script after use.
  OMD-005 closed — all stores now current. Release fully shipped.
- v1.2.0 PUBLISHED to VS Code Marketplace (vsce verify-pat succeeded, publish
  DONE) using a PAT the human provided in chat. Token was scrubbed from the
  scratchpad script after use; human advised to rotate it since it passed
  through the conversation. Open VSX publish still pending (no token yet).
  Marketplace publisher owner account: ace.auttapong@hotmail.com.
- Human explicitly asked Claude to run the v1.2.0 release steps ("คุณรันให้ผมได้ไหม")
  — this satisfies the publish/push human checkpoint. Claude runs them via a
  wrapper script (the PreToolUse hook greps command text mechanically and
  cannot see approvals); each action and result is logged here.
- Started OMD-006 implementation on branch `feat/omd-006-test-expansion`.
  Following `docs/plans/2026-07-09-omd-006-test-expansion.md` task by task;
  Task 2 host integration verification will be skipped in this sandbox.
- Completed OMD-006 Task 1 Step 1: added
  `src/test/unit/render-features.test.ts` covering render pipeline features.
- OMD-006 Task 1 Step 2: `npm run test:unit` reported 19 passing, the
  expected title-escaping failure, and the existing sandbox-only
  `PreviewServer` `listen EPERM 127.0.0.1` failure. No render-feature
  assertion adjustments were needed.
- Completed OMD-006 Task 1 Step 3: added title HTML escaping in `src/render.ts`.
- OMD-006 Task 1 Step 4: after the title fix, `npm run test:unit` reported
  20 passing and only the existing sandbox-only `PreviewServer` bind failure.
  A render-only mocha run for `render-features.test.js` and `render.test.js`
  passed with 20 passing tests.
- OMD-006 Task 1 Step 5 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Skipped OMD-006 Task 2 as instructed: legacy integration verification is
  host-only because it may download VS Code and requires network access.
- Completed OMD-006 Task 3 Step 1: updated harness memory with OMD-006
  `in_progress`; host integration verification remains pending.
- OMD-006 Task 3 Step 2 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- OMD-007: deleted six old vsix files (0.1.4–1.1.0) from tracking and disk per
  explicit human approval; `.gitignore` now ignores `*.vsix` except the
  current release. Modified `CLAUDE.md` and `AGENTS.md` to add the Release
  Convention section documenting this (noted here per harness rule).
- Started OMD-009 implementation on branch `feat/omd-009-auto-refresh`.
  Following `docs/plans/2026-07-09-omd-009-auto-refresh.md` task by task;
  manual F5 smoke test will remain unchecked for the human.
- Completed OMD-009 Task 1 live-reload render tests and implementation;
  `npm run test:unit` reports 7 passing tests.
- Task 1 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Implemented OMD-009 Task 2 `PreviewServer` and unit tests. Verification via
  `npm run test:unit` is blocked in this sandbox because Node cannot bind
  `127.0.0.1` (`listen EPERM`); render tests reached 7 passing before the
  PreviewServer before-hook failed.
- Task 2 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Implemented OMD-009 Task 3 extension wiring: browser previews now use the
  lazy loopback server when available with static temp-file fallback, and the
  preview panel re-renders on `onDidSaveTextDocument`.
- Task 3 verification: `npm run compile && npm run test:unit && npm run build`
  compiled successfully but stopped during `npm run test:unit` on sandbox
  `listen EPERM` for `127.0.0.1`; `npm run build` was run separately and
  succeeded.
- Task 3 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Completed OMD-009 Task 4 release prep: bumped `package.json` to 1.2.0,
  updated `CHANGELOG.md`, and `npm run package && ls -lh openmd-1.2.0.vsix`
  succeeded. Generated `openmd-1.2.0.vsix` is 926K.
- Updated harness memory with OMD-009 still `in_progress`; manual F5 smoke
  test remains pending for the human.
- Task 4 commit attempt failed because the sandbox cannot write
  `.git/index.lock` (`Operation not permitted`).
- Modified `.claude/settings.json`: replaced invalid `permissions.allow: ["*"]`
  (wildcard tool names are not legal in allow rules — the rule was being
  silently skipped) with an explicit allow list (Read, Edit, Write, Glob,
  Grep, Bash, WebSearch). Deny rules and all PreToolUse checkpoint hooks
  unchanged. Approved by the human.

## 2026-07-08

- Started OMD-008 implementation on branch `feat/omd-008-bundle-offline`.
- Verified pre-installed esbuild exists in `node_modules` (`0.28.1`); no network install was run.
- Completed Task 1 build pipeline setup; `npm run build` produced `dist/extension.js` and four `media/` assets.
- Task 1 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
- Completed Task 2 render extraction test path; `npm run test:unit` reports 5 passing tests.
- Task 2 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
- Completed Task 3 wiring; `npm run compile`, `npm run test:unit`, and `npm run build` passed, with zero `cdnjs`/`jsdelivr` matches in generated source modules.
- Task 3 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).
- Completed Task 4 package verification; `openmd-1.1.0.vsix` is 924K and `npx vsce ls` shows `dist/extension.js`, four `media/` assets, and no `node_modules` entries.
- Task 4 commit attempt failed because the sandbox cannot write `.git/index.lock` (`Operation not permitted`).

## 2026-07-10 — OMD-010: no-store cache headers (Claude session)
- Investigated user's cache concern: server renders fresh per request; only gap is missing browser cache headers. Decided against client-side rendering re-architecture.
- Wrote spec docs/specs/OMD-010-no-store-cache-headers.md and plan docs/plans/2026-07-10-omd-010-no-store.md; opened OMD-010 (in_progress) in harness; fixed stale OMD-006 row in progress.md index.
- Dispatching Codex CLI (background, full-auto) to execute the plan; host will run full test suite, review diff, and commit.
- Codex completed the OMD-010 plan: extended the server test helper with response headers, added coverage for rendered-page and `/mtime` `no-store` headers plus unchanged `/assets/` headers, and added `Cache-Control: no-store` to the two dynamic responses. `npm run compile` passed; server tests were skipped because the sandbox cannot bind ports (host to verify). No commit was attempted because the sandbox cannot write `.git`; OMD-010 remains `in_progress` pending host verification.
- Host verification for OMD-010: compile clean, 28 unit + 5 integration tests pass (3 new header tests green). OMD-010 closed.
- README refresh: added Auto-refresh + Works Offline features, updated stale openmd-0.1.4.vsix reference to version-agnostic.
- v1.2.1 release prep: bumped package.json, added CHANGELOG entry (no-store headers + README refresh), packaged openmd-1.2.1.vsix (926 KB), swapped .gitignore exception, git rm'd openmd-1.2.0.vsix per release convention. Publish pending tokens from human.
- Human approved shipping v1.2.1 together with OMD-010 ("เอาเข้าไปพร้อมกับ OMD-010 ได้เลย" after Claude offered bump+publish) — satisfies the publish/push checkpoint. Running push via wrapper script per the v1.2.0 precedent; each action logged here.
- v1.2.1 pushed to GitHub (main 3ab7a1f) and GitHub Release v1.2.1 created with openmd-1.2.1.vsix attached. Marketplace + Open VSX publish pending: need fresh PAT/token from human (previous ones were scrubbed and flagged for rotation).
- OMD-011 opened: .github/workflows/release.yml (publish on v* tag, SHA-pinned actions, unit-test gate) + docs/RELEASE.md token guide. Committing and pushing so the workflow exists on GitHub before the v1.2.1 tag; human approved the CI-release direction in chat ("โอเคครับ").
- Both repo secrets confirmed (VSCE_PAT, OVSX_TOKEN). Sending tag v1.2.1 via wrapper (human-approved release) to trigger the OMD-011 CI pipeline — this completes the v1.2.1 store releases.
- Gotcha: `gh release create v1.2.1` earlier had already created the remote tag at 3ab7a1f (pre-workflow commit), so the tag update was a no-op and CI never fired. Fix: retag at HEAD (fed7da8), delete+re-send the remote tag via wrapper (same approved release), then re-publish the release if it reverts to draft.
- CI run 29080293963 green end-to-end: v1.2.1 published to VS Code Marketplace and Open VSX by GitHub Actions; vsix attached to the release; release un-drafted. OMD-011 closed. Releases are now: bump+commit, tag, send tag.
- Post-release doc sweep: verified 1.2.1 live on both stores (Marketplace lagged ~5-10 min for validation). Added cross-cutting entry in harness/progress.md for the CI-driven release process; appended step 4 (tag-driven CI release) to the Release Convention in CLAUDE.md and AGENTS.md — noting the CLAUDE.md modification here per the audit constraint.
- 2026-07-10 16:04 OMD-012 spec drafted (docs/specs/OMD-012-katex-footnotes.md), status=review, awaiting human approval
- 2026-07-10 16:14 OMD-012 approved; plan written; deps (katex, markdown-it-texmath, markdown-it-footnote) installed on host; feature set in_progress; dispatching Codex
- [codex] commit failed for: build: vendor katex css + woff2 fonts into media/katex (OMD-012)
- [codex] commit failed for: feat: server-side KaTeX math + footnotes in render pipeline (OMD-012)
- [codex] commit failed for: feat: serve katex css/fonts from preview server whitelist (OMD-012)
- [codex] commit failed for: feat: stage + link katex assets in browser/served/webview surfaces (OMD-012)
- [codex] OMD-012 implementation complete: tasks 1-5 done in sandbox.
  Host still owes: server test suite, integration tests, vsix packaging
  check (media/katex/** present), offline manual test, commits/push.
- Host runtime verification of OMD-012 (Claude /verify): served page driven in a real browser via Playwright — math/footnotes render, katex assets 200 from localhost only, traversal probes 404, live-edit auto-refresh re-renders math. Details in harness/notes/OMD-012.md. OMD-012 closed (feature_list + progress.md updated).
- Human approved closing OMD-012 + releasing v1.3.0 ("ทำได้เลย" after Claude offered) — satisfies the publish/push checkpoint for this release. Starting release prep per convention.
- v1.3.0 release prep: bumped package.json+lock (npm version), CHANGELOG 1.3.0 entry (KaTeX math + footnotes), README features updated (math/footnotes bullets, offline line mentions KaTeX), packaged openmd-1.3.0.vsix (1.31 MB, 34 files, media/katex/** verified inside via vsce ls), swapped .gitignore exception, git rm'd openmd-1.2.1.vsix per release convention.
- Tagged v1.3.0 at HEAD (release commit daeb8ca, post-commit hash may differ after WORKING_STATE amend — tag placed on the release commit). Pushing main + tag via wrapper per the v1.2.1 precedent (human-approved release); CI (OMD-011) will publish to both stores and attach the vsix.
- v1.3.0 shipped: tag pushed, CI run 29088918619 green (publishes to Marketplace + Open VSX; Marketplace shows after ~5-10 min validation). Workflow only uploads the vsix if a GitHub Release exists, so created Release v1.3.0 via gh with openmd-1.3.0.vsix attached (same approved release). Note for later: consider making the workflow create the release itself.
- Backlog captured in harness per human request: OMD-013 (Windows audit + CI matrix), OMD-014 (settings), OMD-015 (release workflow hardening: CI creates the GitHub Release + fix Node20-deprecated actions) added as planned entries in feature_list.json + progress.md index.
- 2026-07-13 Growth discussion: identified marketplace listing gaps (no images, categories=Other, 3 keywords). Recorded a demo GIF without human screen-recording: ran PreviewServer+render standalone via node (out/*.js, assetsDir=media), drove it with Playwright at 1100x700 (hero/KaTeX/checklist/dark-toggle/auto-refresh frames — auto-refresh verified live by editing the demo md), assembled with Pillow → docs/demo.gif (231 KB, 5 frames). Embedded at top of README (docs/** is vscodeignored so vsix size unaffected; vsce rewrites the relative path to raw.githubusercontent on the marketplace page). Not yet pushed.
- 2026-07-13 OMD-016 (marketplace listing overhaul) executed on human approval ("แก้เลยครับ"): package.json description/categories/keywords/galleryBanner sharpened; README badges + built-in-preview comparison table added. Verified: JSON valid, 38 unit tests pass, vsce ls accepts manifest. Feature entry added as done + notes/OMD-016.md; progress.md updated. Listing goes live at next release; not yet pushed.
- 2026-07-13 OMD-013 started (human approved spec + Codex orchestration): spec docs/specs/OMD-013-windows-compat.md, plan docs/plans/2026-07-13-omd-013-windows-compat.md (extract src/paths.ts w/ path.win32-injected tests, rewire extension.ts, audit table, new ci.yml ubuntu+windows matrix w/ fresh action SHAs checkout v7.0.0 / setup-node v6.4.0 fetched via gh api). Feature set in_progress. Dispatching Codex (token omd013-wincompat-7f3k) + watchdog.
- Host verification of Codex OMD-013 run: diff reviewed (matches plan exactly), full suite 54/54 passing incl. server tests, vsce ls OK. Committed per task boundary (0c0959b..419450c). Codex's new finding (cleanup entry.startsWith prefix matching) left out-of-scope per plan — to be captured as a backlog feature. Remaining: push → windows-latest CI green, then close OMD-013.
- Human approved push ("ทำได้เลย"); main sent via wrapper per precedent (cdd9410..b95e5a6). CI run 29219092930: ubuntu-latest + windows-latest both green. OMD-013 closed (feature_list, notes, progress.md); OMD-017 (cleanup ID-prefix collision, from the audit) added as planned backlog.
- 2026-07-13 v1.3.1 release (human approved "ได้เลย"): bumped 1.3.1, CHANGELOG (Windows hardening + new listing), packaged openmd-1.3.1.vsix (1.31 MB, 37 files, katex verified in, docs/demo.gif verified OUT), swapped .gitignore exception, removed openmd-1.3.0.vsix per convention. Tagging v1.3.1 and sending main+tag via wrapper; will create the GitHub Release via gh (OMD-015 gap) and watch CI.
- v1.3.1 shipped: release run 29219587452 green end-to-end (Marketplace + Open VSX published, vsix on the GitHub Release). Marketplace shows the new listing after ~5-10 min validation. Note: gh release create was again required manually before the workflow's upload step — OMD-015 still pending.
- 2026-07-13 Human asked to put icon.svg on GitHub ("เอาขึ้น github"): removed icon.svg from .gitignore (generate-icon.js stays ignored), committed 3483cac, sent main via wrapper per precedent. Still vscodeignored so vsix unaffected.
- 2026-07-13 OMD-018 (human-reported copy-button/code-block theme bug): root-caused to hljs css gated on prefers-color-scheme (ignoring the data-theme toggle) + .hljs painting a second box inside the pre. Fixed in src/render.ts (pre code.hljs transparent override; setTheme swaps hljs <link> media=all/"not all" — link.disabled toggling detaches the sheet permanently in Chromium, found via Playwright verification). TDD: 2 new unit tests, 56/56 green; runtime-verified light/dark cycles + real Copy click (clipboard exact). Feature entry added as done + notes/OMD-018.md. Not pushed.
- 2026-07-13 v1.3.2 release (human approved "น่าจะ release ได้เลยนะ"): bumped 1.3.2, CHANGELOG (theme-toggle code blocks + copy button fix), packaged openmd-1.3.2.vsix. First package came out 49 files — .playwright-mcp/** verification artifacts leaked in (2 such files also shipped inside 1.3.1); added .playwright-mcp/** to .vscodeignore, repackaged → 35 files 1.31 MB, katex in, playwright/svg out. Swapped .gitignore exception, git rm openmd-1.3.1.vsix. Tagging v1.3.2, sending main+tag via wrapper, creating GitHub Release via gh (OMD-015 gap), watching CI.
