# Vibe-Switch 開發指引

## 項目概覽
Vibe-Switch 是一個 CLI 工具，定位為「AI Agent 的 tmux」。
讓一人公司用一行命令啟動多 Agent 並行工作，需要時無縫交接上下文。

## 技術棧
- Node.js / TypeScript
- Commander.js (CLI 框架)
- simple-git (Git 操作)
- chalk + cli-table3 (終端輸出)
- JSON 文件存儲 (~/.vibe-switch/)

## 項目結構
```
src/
├── cli.ts              # CLI 入口
├── adapters/           # Agent 適配器 (detect/buildCommand)
├── commands/           # 4 個命令: run, status, stop, handoff
├── core/               # 核心: process, git, store, context
└── utils/              # paths, output
```

## 核心命令
- `vibe run "<task>" --agent <agent>` — 啟動 Agent
- `vibe status` — 查看所有 Agent 狀態
- `vibe stop [branch|--all]` — 停止 Agent  
- `vibe handoff <branch> --to <agent>` — 上下文交接

## 編碼規範
- 使用 TypeScript strict 模式
- 用 `async/await` 處理異步
- process.exit() 後必須加 return（TypeScript 控制流）
- chalk 使用動態 import（ESM 兼容）
- 保持 KISS 原則，不過度工程化

## 構建與測試
```bash
npx tsc          # 編譯
npx tsx src/cli.ts status  # 直接運行測試
```
