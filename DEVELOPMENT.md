# 🛠️ Development Guide

This guide is for developers who want to build, test, or contribute to OpenMD.

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [VS Code](https://code.visualstudio.com/)
- Git

## 🚀 Setup

```bash
# Clone the repository
git clone https://github.com/AuttapOnG/OpenMD.git
cd OpenMD

# Install dependencies
npm install
```

## 🔧 Build & Run

```bash
# Compile TypeScript
npm run compile

# Watch for changes (auto-compile)
npm run watch

# Run tests
npm test

# Build VSIX package
npm run package
```

## 🐛 Debug

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VS Code window

## 🧪 Testing

### Manual Testing
1. Run the extension (`F5`)
2. Right-click on any `.md` file in the Explorer
3. Verify both "Open in Browser" and "Open in Preview" menus appear
4. Test both features

### Automated Testing
```bash
npm test
```

## 📦 Publishing

### Build VSIX
```bash
npm run package
```

### Publish to VS Code Marketplace
```bash
# Login (first time only)
npx vsce login auttapong-tura

# Publish
npm run publish
```

## 🎨 Icon Generation

The extension icon is generated from `icon.svg` using Sharp:

```bash
node generate-icon.js
```

## 📝 Project Structure

```
.
├── src/
│   ├── extension.ts          # Main extension code
│   └── test/                 # Test files
├── out/                      # Compiled JavaScript
├── icon.png                  # Extension icon (128x128)
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
└── README.md                 # User documentation
```

## 🤝 Contributing Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
