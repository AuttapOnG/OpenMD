# Changelog

All notable changes to the "OpenMD" extension will be documented in this file.

## [1.3.3] - 2026-07-13

### Fixed
- 🧹 **Startup cleanup no longer touches other extensions** - The activation-time temp cleanup now matches only OpenMD's own versioned folders; an unrelated extension whose ID merely starts with ours can no longer have its `.temp` folder deleted

## [1.3.2] - 2026-07-13

### Fixed
- 🎨 **Code blocks now follow the theme toggle** - Syntax highlighting colors and code-block background switch with the in-page light/dark/auto toggle instead of only the OS theme (no more white code boxes on a dark page)
- 📋 **Copy button sits inside the code block** - highlight.js themes no longer draw a second box inside code blocks, which had left the Copy button stranded outside the visible block

## [1.3.1] - 2026-07-13

### Fixed
- 🪟 **Windows compatibility** - Path handling audited and hardened for Windows (drive letters, backslashes, `USERPROFILE`, case-insensitive home comparison); unit tests now run on Windows and Linux in CI for every change

### Changed
- 🖼️ **New Marketplace listing** - Demo GIF, feature comparison with the built-in preview, better search keywords and gallery banner

## [1.3.0] - 2026-07-10

### Added
- 🧮 **Math rendering (KaTeX)** - `$inline$` and `$$display$$` TeX math rendered server-side; works fully offline (KaTeX css + fonts bundled). Plain `$5` text stays literal, `\$` escapes, invalid TeX shows an inline error instead of breaking the page
- 📝 **Footnotes** - GitHub-style `[^1]` references with definitions and backlinks

## [1.2.1] - 2026-07-10

### Fixed
- 🚫 **No stale previews** - Preview pages and the live-reload endpoint now send `Cache-Control: no-store`, so the browser never serves a cached copy

### Changed
- 📝 **README refresh** - Documented auto-refresh and offline support; removed outdated version references

## [1.2.0] - 2026-07-09

### Added
- 🔄 **Auto-refresh** - Save the file and the browser preview reloads within 1-2 s (scroll preserved); the VS Code preview panel updates instantly
- 🌐 Browser preview now served from a local-only server (127.0.0.1) instead of static temp files

## [1.1.0] - 2026-07-08

### Changed
- 📦 **Tiny package** - Bundled with esbuild; vsix shrinks from ~24 MB to ~3 MB
- 🔌 **Works offline** - Mermaid and syntax highlighting no longer load from CDN

## [1.0.0] - 2025-02-16

### Added
- 🎉 **Stable Release** - v1.0.0 พร้อมใช้งานจริง
- 📁 **Mirror Path Temp Files** - Temp HTML files สร้างตาม project path (เช่น `Project/OpenMD/README.md` → `.temp/Project/OpenMD/README.html`)
- 🧹 **Global Cleanup** - ลบ temp files ทุก version ของ extension ตอน activate

## [0.1.7] - 2025-02-16

### Changed
- 📁 **Mirror Path Temp Files** - Temp HTML files สร้างตาม mirror path ของไฟล์ต้นฉบับ (เช่น `/project/docs/readme.md` → `.temp/project/docs/readme.html`)
- 🧹 **Auto Cleanup** - ลบ temp files ทั้งหมดตอนเปิด VS Code ใหม่ ป้องกันไฟล์สะสม

## [0.1.6] - 2025-02-11

### Fixed
- 🐛 **Fix broken extension** - แก้ไข .vscodeignore ที่ผิดพลาดทำให้ node_modules หาย (extension ใช้ไม่ได้)

## [0.1.5] - 2025-02-11

### Removed
- 🗑️ **Toast Notification** - ลบข้อความ "Opening Markdown in browser..." ออก

## [0.1.4] - 2025-02-11

### Added
- 😄 **Emoji Shortcodes** - เพิ่มการแปลง `:wave:` → 👋, `:rocket:` → 🚀, `:fire:` → 🔥 ฯลฯ (client-side conversion)

### Fixed
- 🎨 **Syntax Highlighting** - ย้าย hljs.highlightAll() ไปทำหลัง window load พร้อมกับ Mermaid

## [0.1.3] - 2025-02-11

### Fixed
- 🐛 **hljs is not defined** - แก้ไขการใช้ hljs ที่ไม่ได้ถูก define ใน Node.js (hljs มาจาก CDN ใน browser เท่านั้น)
- 🎨 **Syntax Highlighting** - ย้ายการ highlight ไปทำใน browser โดยใช้ `hljs.highlightAll()`

## [0.1.2] - 2025-02-11

### Fixed
- 🧜‍♀️ **Mermaid Diagrams** - ใช้ `window.onload` แทน `DOMContentLoaded` เพื่อรอ CDN โหลดเสร็จ
- 🐛 **Debug Logging** - เพิ่ม console log เพื่อตรวจสอบว่า plugins โหลดสำเร็จหรือไม่

## [0.1.1] - 2025-02-11

### Fixed
- 🧜‍♀️ **Mermaid Diagrams** - Fixed rendering issue (now uses `mermaid.run()` after DOM ready)
- 🎨 **GitHub Alerts Styling** - Added colorful backgrounds and emoji icons (ℹ️ 💡 🔔 ⚠️ 🛑)
- 🔧 **Improved Initialization** - Better DOM ready handling for all dynamic content

## [0.1.0] - 2025-02-11

### Changed
- 🔄 **Migrated from `marked` to `markdown-it`** - Better plugin ecosystem and extensibility

### Added
- 🎨 **Syntax Highlighting** - Code blocks now have syntax highlighting with highlight.js (GitHub theme)
- 📊 **Mermaid Diagrams** - Full support for Mermaid diagrams (flowcharts, sequence diagrams, etc.)
- ✅ **GitHub-style Task Lists** - Interactive checkboxes with `- [ ]` and `- [x]`
- ⚠️ **GitHub Alerts** - Support for `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`
- 😄 **Emoji Shortcodes** - Convert `:emoji:` to actual emoji (e.g., `:fire:` → 🔥)
- 🔗 **Anchor Links** - Clickable anchor links for all headings
- 📋 **Copy Code Button** - One-click copy for all code blocks
- ⚡ **Faster Extension Activation** - Now activates on VS Code startup, not just when opening Markdown files

### Fixed
- Extension commands now available immediately without needing to open a Markdown file first

## [0.0.7] - 2025-02-09

### Changed
- 🎨 **Unified Theme System** - Open in Preview now uses the same theme logic and CSS as Open in Browser
- Theme preference in preview is now saved using localStorage (consistent with browser)
- Standardized styling between browser preview and VS Code preview panel

## [0.0.6] - 2025-02-09

### Added
- 🎨 **Theme Toggle in Preview** - Added theme switcher (🎨 VS Code / ☀️ Light / 🌙 Dark) in VS Code preview panel
- Theme preference is saved using VS Code Webview State API
- Smooth theme transitions with CSS animations

## [0.0.5] - 2025-02-05

### Added
- 🌓 **Dark Mode Toggle** - Added theme switcher (☀️ Light / 🌙 Dark / 💻 Auto) in browser preview
- Theme preference is saved in browser localStorage

### Changed
- Reverted from Live Server back to static HTML for better stability
- Updated README with Dark Mode feature

## [0.0.4] - 2025-02-05

### Changed
- Simplified extension by removing Live Server functionality
- Back to basic static HTML generation for browser preview
- Removed WebSocket dependency (`ws`)

## [0.0.3] - 2025-02-05

### Added
- 🔄 **Live Server** - Real-time preview with auto-reload on file save
- 🌐 **WebSocket** support for live updates
- 📡 **Live Indicator** badge showing connection status
- 🛑 **Status Bar** showing active Live Server with port number
- **Stop All Servers** command to stop all running Live Servers

### Changed
- Renamed command to "Open in Browser (Live)"
- Updated README with Live Server features

## [0.0.2] - 2025-02-05

### Added
- Extension icon support

### Fixed
- Package configuration improvements

## [0.0.1] - 2025-02-05

### Added
- 🌐 **Open in Browser** - Open Markdown files in default browser as styled HTML
- 👁️ **Open in Preview** - Open Markdown in VS Code side panel
- 🎨 **GitHub-style CSS** with automatic Dark Mode support
- Right-click context menu in Explorer and Editor
