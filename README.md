# 🔄 Vibe-Switch

[![npm version](https://img.shields.io/npm/v/vibe-switch.svg)](https://www.npmjs.com/package/vibe-switch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

> **tmux for AI Agents** — Orchestrate multiple AI coding agents in parallel with one command.
>
> 🤖 **AI Agents**: If you are an AI coding assistant, see [docs/ai-skill.md](./docs/ai-skill.md) for the machine-readable command reference and orchestration guide.

[繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | English

## Why Vibe-Switch?

Whether you are running commands yourself or letting an AI orchestrator dispatch agents on your behalf, managing multiple AI agents is a cognitive nightmare. If you are a developer using Claude Code, Codex, and Gemini CLI simultaneously, you often face:

- **Terminal Overload:** Dozens of open windows for different tasks.
- **Context Loss:** Manually copying files and diffs between agents to "hand off" work.
- **Process Chaos:** Forgetting which agent is working on which branch or how to stop them all.

**Vibe-Switch** provides a unified CLI to orchestrate multiple agents in isolated environments with seamless context handoff.

## Install

```bash
npm install -g vibe-switch
```

Or install from source:

```bash
git clone https://github.com/brianjhang/vibe-switch.git
cd vibe-switch
npm install
npm run build
npm link
```

> 💡 After installing, the CLI command is **`vibe`** (not `vibe-switch`). Both `vibe` and `vibe-switch` work, but all examples use `vibe` for brevity.

## Quick Start

### 1. Run Multiple Agents

Start different tasks with different agents in one line:

```bash
# Backend task with Gemini
vibe run "Implement JWT authentication middleware" --agent gemini

# Frontend task with Codex
vibe run "Build a responsive login page with React" --agent codex
```

### 2. Check Status

Get a bird's-eye view of all your active tasks:

```bash
vibe status
```

| Agent | Task | Status | Branch | Modified |
| :--- | :--- | :--- | :--- | :--- |
| ◎ Codex | Build login page... | 🟢 running | vibe/codex-b2e4 | 3 |
| ◆ Gemini | Implement JWT... | ✅ done | vibe/gemini-c3d5 | 2 |

### 3. Watch Activity

```bash
vibe watch    # Real-time multi-agent output with color-coded labels
```

### 4. Inspect Logs

```bash
vibe log vibe/codex-b2e4 -f    # Tail the logs of a specific agent
```

### 5. Seamless Handoff

Finished a backend API with Gemini? Hand the context directly to Codex to build the UI:

```bash
vibe handoff vibe/gemini-c3d5 --to codex -m "API is ready at /api/auth"
```

### 6. Stop and Cleanup

```bash
vibe stop --all    # Stop all agents
vibe clean         # Clean up finished tasks and worktrees
```

## All Commands

| Command | Description |
|---------|-------------|
| `vibe run` | Start an agent task in an isolated Git worktree |
| `vibe status` | Display a live table of all tasks, status, and branches |
| `vibe watch` | Real-time multi-pane log viewer for all running agents |
| `vibe log` | View/follow logs for a specific task (`-f` for real-time) |
| `vibe stop` | Stop a single agent or all agents |
| `vibe handoff` | Transfer context from one agent to another |
| `vibe summary` | Auto-summarize an agent's work (log + git diff) |
| `vibe clean` | Clean up completed tasks, logs, and worktrees |
| `vibe agents` | List installed agents and their status |
| `vibe init` | Initialize project-level vibe-switch config |
| `vibe config` | View or update configuration |
| `vibe wait` | Block until a task finishes (for chaining with `&&`) |

## Supported Agents

Vibe-Switch orchestrates **terminal-native AI coding CLIs** — tools that can accept a task and execute autonomously in a headless process. GUI-based editors (Cursor, Windsurf, etc.) cannot be dispatched, but you can run `vibe` from their integrated terminals.

| Icon | Agent | CLI Command | Headless Flag |
| :---: | :--- | :--- | :--- |
| ✦ | **Claude Code** | `claude` | `-p "task"` |
| ◎ | **Codex CLI** | `codex` | `exec --full-auto "task"` |
| ◆ | **Gemini CLI** | `gemini` | `-p "task"` |

> 💡 **Adding more agents:** The modular adapter pattern makes it easy to integrate new CLI agents. See `src/adapters/` for examples.

## Architecture

- **Git Worktree Isolation:** Each agent runs in a dedicated directory and branch, ensuring no file conflicts.
- **Adapter Pattern:** Modular design allows easy integration of new AI agent CLIs.
- **JSON File Storage:** Task metadata, PIDs, and state are persisted locally — no database needed.

## Author

Created by [Brian Jhang](https://brianjhang.com) — building tools for the one-person company era.

## License

[MIT](./LICENSE)
