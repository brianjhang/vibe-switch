#!/bin/bash
# 快速啟動 Vibe-Kanban 試用
# 使用方式: ./start-vibe-kanban.sh

export PATH="/opt/homebrew/bin:$PATH"
export PORT=9876

echo "🚀 啟動 Vibe-Kanban..."
echo "📍 啟動後訪問: http://localhost:9876"
echo "⏹️  按 Ctrl+C 停止"
echo ""

npx -y vibe-kanban@latest
