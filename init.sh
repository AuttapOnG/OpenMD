#!/usr/bin/env bash

echo "=== OpenMD — Agent Session Init ==="
echo "Stack: TypeScript + VS Code Extension API, markdown-it, Mermaid, highlight.js"
echo ""

# Git status
git status --short 2>/dev/null || echo "Not a git repo"

# Active specs
echo "--- Active specs ---"
ls docs/specs/*.md 2>/dev/null | xargs grep -l "status: approved" 2>/dev/null || echo "None"

echo ""
echo "=== Ready ==="
