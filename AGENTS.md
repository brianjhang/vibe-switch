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
├── commands/           # 11 個命令: run, status, stop, log, watch, clean, agents, summary, init, config, handoff
├── core/               # 核心: process, git, store, context, config, logStream
└── utils/              # paths, output
```

## 核心命令
共 11 個命令：

- `vibe run "<task>" --agent <agent>` — 啟動 Agent，建立分支與隔離 worktree
- `vibe status` — 查看所有 Agent 任務狀態
- `vibe stop [branch|--all]` — 停止單一或全部 Agent，並嘗試清理 worktree
- `vibe log <branch> [-f|--follow]` — 查看或追蹤指定任務日誌
- `vibe watch` — 實時查看所有運行中 Agent 的輸出
- `vibe clean` — 清理 completed/stopped/failed 任務、日誌與 worktree
- `vibe agents` — 列出可用 Agent adapter 與安裝狀態
- `vibe summary <branch>` — 查看任務摘要、近期日誌與 diff stat
- `vibe init` — 建立 `.vibeswitch.json` 專案配置
- `vibe config [key] [value]` — 查看或設定專案配置
- `vibe handoff <branch> --to <agent>` — 上下文交接到另一個 Agent

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
