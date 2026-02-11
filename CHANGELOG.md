# Changelog

All notable changes to the "OpenMD" extension will be documented in this file.

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
