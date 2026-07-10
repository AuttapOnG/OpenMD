# Release Guide

Releases are published automatically by GitHub Actions
(`.github/workflows/release.yml`) when a `v*` tag is pushed.

## Releasing a new version

1. Bump `package.json` version + add a CHANGELOG entry, package the vsix,
   swap the `.gitignore` exception, `git rm` the old vsix (see the release
   convention in CLAUDE.md), and commit.
2. Tag and push:
   ```
   git tag v<X.Y.Z>
   git push origin main v<X.Y.Z>
   ```
3. Done. The workflow runs unit tests, packages, and publishes to the
   VS Code Marketplace and Open VSX. Watch it in the repo's **Actions** tab.

## One-time setup: tokens (and how to get them again when they expire)

Two repo secrets are required: `VSCE_PAT` and `OVSX_TOKEN`.

### VSCE_PAT — VS Code Marketplace (Azure DevOps PAT)

1. Go to <https://dev.azure.com> and sign in with the Microsoft account that
   owns the `auttapong-tura` publisher (**ace.auttapong@hotmail.com**).
2. Click the **User settings** icon (top-right, next to your avatar) →
   **Personal access tokens**.
3. **+ New Token**:
   - Name: `vsce-publish` (anything works)
   - **Organization: "All accessible organizations"** ← สำคัญ ถ้าเลือก org
     เดียว vsce จะ 401
   - Expiration: up to 1 year (custom)
   - Scopes: **Custom defined** → click **Show all scopes** → find
     **Marketplace** → tick **Manage**
4. **Create** and copy the token — it is shown only once.

> ⚠️ Azure DevOps stops supporting all-orgs ("global") PATs on
> **2026-12-01**, so don't set an expiration past 2026-11-30. When the
> current token dies around that date, check the then-current vsce guidance
> for the replacement (Microsoft is moving publishers to scoped tokens /
> Entra ID auth): <https://code.visualstudio.com/api/working-with-extensions/publishing-extension>

### OVSX_TOKEN — Open VSX

1. Go to <https://open-vsx.org> and **log in with GitHub**.
2. Click your avatar (top-right) → **Settings** → **Access Tokens**.
3. **Generate New Token** (description: `openmd-publish`), copy it —
   shown only once.

### Store them as GitHub repo secrets

Run in a terminal (each prompts for the value, hidden — the token never
lands in shell history or chat):

```
gh secret set VSCE_PAT  --repo AuttapOnG/OpenMD
gh secret set OVSX_TOKEN --repo AuttapOnG/OpenMD
```

Or via web: repo → **Settings → Secrets and variables → Actions →
New repository secret**.

## When publish fails with 401/403

The corresponding token has expired or lost scope — regenerate it with the
steps above and `gh secret set` it again. Nothing in the repo needs to
change.
