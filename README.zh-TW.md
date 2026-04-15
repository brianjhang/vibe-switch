# 🔄 Vibe-Switch

[![npm version](https://img.shields.io/npm/v/vibe-switch.svg)](https://www.npmjs.com/package/vibe-switch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

> **AI Agent 的 tmux** — 一行命令啟動多 Agent 並行工作，無縫交接上下文。
>
> 🤖 **AI Agent 使用指南**：如果你是 AI 編程助手，請參閱 [docs/ai-skill.md](./docs/ai-skill.md) 獲取機器可讀的指令參考和編排指南。

[English](./README.md) | 繁體中文 | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

## 為什麼需要 Vibe-Switch？

無論你是自己下指令，還是讓 AI 編排器自動調度多個 Agent，同時管理多個 AI Agent 都是一場認知噩夢。同時用 Claude Code、Codex、Gemini CLI 開發時，你會遇到：

- **終端爆炸**：每個 Agent 開一個窗口，切來切去。
- **上下文丟失**：Agent A 做完的東西，要手動複製給 Agent B。
- **進程混亂**：忘了哪個 Agent 在做什麼、PID 是多少。

**Vibe-Switch** 提供統一的 CLI，在隔離環境中編排多個 Agent，無縫交接上下文。

## 安裝

```bash
npm install -g vibe-switch
```

或從源碼安裝：

```bash
git clone https://github.com/brianjhang/vibe-switch.git
cd vibe-switch
npm install
npm run build
npm link
```

> 💡 安裝後，CLI 指令是 **`vibe`**（不是 `vibe-switch`）。`vibe` 和 `vibe-switch` 都能用，但所有範例統一使用 `vibe`。

## 快速上手

### 1. 啟動多個 Agent

```bash
# 後端任務交給 Gemini
vibe run "實作 JWT 認證 middleware" --agent gemini

# 前端任務交給 Codex
vibe run "用 React 做一個響應式登入頁面" --agent codex
```

### 2. 查看狀態

```bash
vibe status
```

| Agent | 任務 | 狀態 | 分支 | 已修改 |
| :--- | :--- | :--- | :--- | :--- |
| ◎ Codex | 做登入頁面... | 🟢 running | vibe/codex-b2e4 | 3 |
| ◆ Gemini | 實作 JWT... | ✅ done | vibe/gemini-c3d5 | 2 |

### 3. 即時監控

```bash
vibe watch    # 同時看到所有 Agent 的即時輸出，彩色標籤區分
```

### 4. 查看日誌

```bash
vibe log vibe/codex-b2e4 -f    # 追蹤特定 Agent 的輸出
```

### 5. 上下文交接

Gemini 做完後端 API？直接把上下文交給 Codex 做前端：

```bash
vibe handoff vibe/gemini-c3d5 --to codex -m "API 已經在 /api/auth 準備好了"
```

### 6. 停止與清理

```bash
vibe stop --all    # 停止所有 Agent
vibe clean         # 清理已完成的任務和 worktree
```

## 完整命令列表

| 命令 | 說明 |
|------|------|
| `vibe run` | 啟動 Agent 執行任務（自動建立 Git Worktree 隔離） |
| `vibe status` | 表格總覽所有任務的狀態、分支、PID |
| `vibe watch` | 即時多路串流，同時看所有 Agent 的輸出 |
| `vibe log` | 查看/追蹤特定任務的日誌（支援 `-f` 即時追蹤） |
| `vibe stop` | 停止單個或全部 Agent |
| `vibe handoff` | 帶上下文交接給另一個 Agent |
| `vibe summary` | 自動總結 Agent 的工作成果（日誌 + diff） |
| `vibe clean` | 清理已完成的任務記錄、日誌和 worktree |
| `vibe agents` | 列出已安裝的 Agent 及狀態 |
| `vibe init` | 初始化項目的 vibe-switch 配置 |
| `vibe config` | 查看或設定配置 |
| `vibe wait` | 等待任務完成（可用 `&&` 串接下一步） |

## 支援的 Agent

Vibe-Switch 編排的是**終端原生的 AI Coding CLI 工具**——能接受任務並在背景自主執行的 headless 程式。GUI 編輯器（Cursor、Windsurf 等）無法被調度，但你可以在它們的內建終端裡使用 `vibe` 指令。

| 圖示 | Agent | CLI 指令 | Headless 參數 |
| :---: | :--- | :--- | :--- |
| ✦ | **Claude Code** | `claude` | `-p "task"` |
| ◎ | **Codex CLI** | `codex` | `exec --full-auto "task"` |
| ◆ | **Gemini CLI** | `gemini` | `-p "task"` |

> 💡 **擴充更多 Agent**：模組化的 Adapter 模式讓新增 CLI agent 非常容易。參見 `src/adapters/` 目錄。

## 架構

- **Git Worktree 隔離**：每個 Agent 在獨立的目錄和分支中工作，零衝突。
- **Adapter 模式**：新增 Agent 只需加一個適配器文件。
- **JSON 存儲**：任務狀態存在本地 JSON 文件，輕量零依賴。

## 作者

由 [Brian Jhang](https://brianjhang.com) 創建 — 為一人公司時代打造工具。

## License

[MIT](./LICENSE)
