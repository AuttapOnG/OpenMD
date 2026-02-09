# Changelog

All notable changes to the "OpenMD" extension will be documented in this file.

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
