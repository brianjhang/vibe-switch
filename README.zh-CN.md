# 🔄 Vibe-Switch

[![npm version](https://img.shields.io/npm/v/vibe-switch.svg)](https://www.npmjs.com/package/vibe-switch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

> **AI Agent 的 tmux** — 一行命令启动多 Agent 并行工作，无缝交接上下文。
>
> 🤖 **AI Agent 使用指南**：如果你是 AI 编程助手，请参阅 [docs/ai-skill.md](./docs/ai-skill.md) 获取机器可读的指令参考和编排指南。

[English](./README.md) | [繁體中文](./README.zh-TW.md) | 简体中文 | [日本語](./README.ja.md)

## 为什么需要 Vibe-Switch？

无论你是自己下指令，还是让 AI 编排器自动调度多个 Agent，同时管理多个 AI Agent 都是一场认知噩梦。同时用 Claude Code、Codex、Gemini CLI 开发时，你会遇到：

- **终端爆炸**：每个 Agent 开一个窗口，切来切去。
- **上下文丢失**：Agent A 做完的东西，要手动复制给 Agent B。
- **进程混乱**：忘了哪个 Agent 在做什么、PID 是多少。

**Vibe-Switch** 提供统一的 CLI，在隔离环境中编排多个 Agent，无缝交接上下文。

## 安装

```bash
npm install -g vibe-switch
```

或从源码安装：

```bash
git clone https://github.com/brianjhang/vibe-switch.git
cd vibe-switch
npm install
npm run build
npm link
```

> 💡 安装后，CLI 命令是 **`vibe`**（不是 `vibe-switch`）。`vibe` 和 `vibe-switch` 都能用，但所有示例统一使用 `vibe`。

## 快速上手

### 1. 启动多个 Agent

```bash
# 后端任务交给 Gemini
vibe run "实现 JWT 认证 middleware" --agent gemini

# 前端任务交给 Codex
vibe run "用 React 做一个响应式登录页面" --agent codex
```

### 2. 查看状态

```bash
vibe status
```

| Agent | 任务 | 状态 | 分支 | 已修改 |
| :--- | :--- | :--- | :--- | :--- |
| ◎ Codex | 做登录页面... | 🟢 running | vibe/codex-b2e4 | 3 |
| ◆ Gemini | 实现 JWT... | ✅ done | vibe/gemini-c3d5 | 2 |

### 3. 实时监控

```bash
vibe watch    # 同时看到所有 Agent 的实时输出，彩色标签区分
```

### 4. 查看日志

```bash
vibe log vibe/codex-b2e4 -f    # 跟踪特定 Agent 的输出
```

### 5. 上下文交接

Gemini 做完后端 API？直接把上下文交给 Codex 做前端：

```bash
vibe handoff vibe/gemini-c3d5 --to codex -m "API 已经在 /api/auth 准备好了"
```

### 6. 停止与清理

```bash
vibe stop --all    # 停止所有 Agent
vibe clean         # 清理已完成的任务和 worktree
```

## 完整命令列表

| 命令 | 说明 |
|------|------|
| `vibe run` | 启动 Agent 执行任务（自动创建 Git Worktree 隔离） |
| `vibe status` | 表格总览所有任务的状态、分支、PID |
| `vibe watch` | 实时多路串流，同时看所有 Agent 的输出 |
| `vibe log` | 查看/跟踪特定任务的日志（支持 `-f` 实时跟踪） |
| `vibe stop` | 停止单个或全部 Agent |
| `vibe handoff` | 带上下文交接给另一个 Agent |
| `vibe summary` | 自动总结 Agent 的工作成果（日志 + diff） |
| `vibe clean` | 清理已完成的任务记录、日志和 worktree |
| `vibe agents` | 列出已安装的 Agent 及状态 |
| `vibe init` | 初始化项目的 vibe-switch 配置 |
| `vibe config` | 查看或设定配置 |
| `vibe wait` | 等待任务完成（可用 `&&` 串接下一步） |

## 支持的 Agent

Vibe-Switch 编排的是**终端原生的 AI Coding CLI 工具**——能接受任务并在后台自主执行的 headless 程序。GUI 编辑器（Cursor、Windsurf 等）无法被调度，但你可以在它们的内置终端里使用 `vibe` 指令。

| 图标 | Agent | CLI 指令 | Headless 参数 |
| :---: | :--- | :--- | :--- |
| ✦ | **Claude Code** | `claude` | `-p "task"` |
| ◎ | **Codex CLI** | `codex` | `exec --full-auto "task"` |
| ◆ | **Gemini CLI** | `gemini` | `-p "task"` |

> 💡 **扩充更多 Agent**：模块化的 Adapter 模式让新增 CLI agent 非常容易。参见 `src/adapters/` 目录。

## 架构

- **Git Worktree 隔离**：每个 Agent 在独立的目录和分支中工作，零冲突。
- **Adapter 模式**：新增 Agent 只需加一个适配器文件。
- **JSON 存储**：任务状态存在本地 JSON 文件，轻量零依赖。

## 作者

由 [Brian Jhang](https://brianjhang.com) 创建 — 为一人公司时代打造工具。

## License

[MIT](./LICENSE)
