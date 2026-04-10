# 🔄 Vibe-Switch

> **AI Agent 的 tmux** — 一行命令啟動多 Agent 並行工作，無縫交接上下文。

## 為什麼需要 Vibe-Switch？

你是一人公司，同時用 Claude Code、Codex、Gemini CLI 做開發。

| 問題 | 現狀 | Vibe-Switch |
|------|------|-------------|
| 啟動多個 Agent | 手動開多個終端窗口 | `vibe run "任務" --agent claude` |
| 查看誰在做什麼 | 自己記住 | `vibe status` |
| Agent A 做完交給 B | 手動複製上下文 | `vibe handoff <branch> --to codex` |
| 停止所有 Agent | 逐個找 PID kill | `vibe stop --all` |

## 安裝

```bash
git clone https://github.com/your/vibe-switch.git
cd vibe-switch
npm install
npm run build
npm link
```

## 使用方式

### 啟動 Agent

```bash
# 讓 Claude 做後端 API
vibe run "implement REST API with JWT auth" --agent claude

# 讓 Codex 做前端
vibe run "build login page with React" --agent codex

# 讓 Gemini 寫測試
vibe run "write integration tests" --agent gemini
```

### 查看狀態

```bash
vibe status
```

```
┌───────────┬───────────────────────────┬──────────┬──────────────────┬────────┐
│ Agent     │ 任務                      │ 狀態     │ 分支             │ 已修改 │
├───────────┼───────────────────────────┼──────────┼──────────────────┼────────┤
│ ✦ Claude  │ implement REST API...     │ 🟢 running│ vibe/claude-a1f3│ 5      │
│ ◎ Codex   │ build login page...       │ 🟢 running│ vibe/codex-b2e4 │ 3      │
│ ◆ Gemini  │ write integration tests   │ ✅ done   │ vibe/gemini-c3d5│ 2      │
└───────────┴───────────────────────────┴──────────┴──────────────────┴────────┘
```

### 上下文交接

```bash
# Claude 做完後，讓 Codex 接力
vibe handoff vibe/claude-a1f3 --to codex

# 帶額外說明
vibe handoff vibe/claude-a1f3 --to codex -m "API schema 在 /api/schema.ts"
```

### 停止 Agent

```bash
vibe stop vibe/claude-a1f3    # 停止特定任務
vibe stop --all                # 停止所有
```

## 支持的 Agent

| Agent | 命令 | 狀態 |
|-------|------|------|
| Claude Code | `claude` | ✅ |
| Codex CLI | `codex` | ✅ |
| Gemini CLI | `gemini` | ✅ |
| Antigravity | `gemini` | ✅ |
| OpenClaw | `openclaw` | ✅ |

## 和 Vibe-Kanban 的區別

| | Vibe-Kanban | Vibe-Switch |
|---|---|---|
| 介面 | Web UI (點點點) | CLI (打字) |
| 啟動 Agent | 6 步操作 | 1 行命令 |
| 目標用戶 | 團隊 | 一人公司 |
| 核心能力 | 可視化管理 | 零摩擦 + 上下文交接 |

## License

MIT
