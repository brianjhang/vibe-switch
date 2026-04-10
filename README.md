# 🔄 Vibe-Switch

> **AI Agent 的 tmux — 一行命令啟動多 Agent 並行工作，無縫交接上下文。**

[繁體中文](./README.zh-TW.md) | English

## Why Vibe-Switch?

Managing multiple AI agents manually is a cognitive nightmare. If you are a developer using Claude Code, Codex, and Gemini CLI simultaneously, you often face:
- **Terminal Overload:** Dozens of open windows for different tasks.
- **Context Loss:** Manually copying files and diffs between agents to "hand off" work.
- **Process Chaos:** Forgetting which agent is working on which branch or how to stop them all.

**Vibe-Switch** provides a unified CLI to orchestrate multiple agents in isolated environments with seamless context handoff.

## Install

```bash
git clone https://github.com/vibe-switch/vibe-switch.git
cd vibe-switch
npm install
npm run build
npm link
```

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
Get a bird's-eye view of all your active "vibes":
```bash
vibe status
```
| Agent | Task | Status | Branch | Modified |
| :--- | :--- | :--- | :--- | :--- |
| ◎ Codex | Build login page... | 🟢 running | vibe/codex-b2e4 | 3 |
| ◆ Gemini | Implement JWT... | ✅ done | vibe/gemini-c3d5 | 2 |

### 3. Watch Activity
```bash
vibe watch    # Interactive dashboard to monitor all active agents
```

### 4. Inspect Logs
```bash
vibe log -f   # Tail the logs of a specific agent/task
```

### 5. Seamless Handoff
Finished a backend API with Gemini? Hand the context directly to Codex to build the UI:
```bash
vibe handoff vibe/gemini-c3d5 --to codex -m "API is ready at /api/auth"
```

### 6. Stop and Cleanup
```bash
vibe stop --all
```

## ALL Commands

- **`run`**: Spin up a new AI agent task in an isolated Git worktree.
- **`status`**: Display a live table of all tasks, their status, and associated git branches.
- **`watch`**: An interactive multi-pane log viewer for monitoring all running agents in real-time.
- **`log`**: Access detailed execution logs for any specific task or agent.
- **`stop`**: Gracefully terminate agent processes and clean up temporary worktrees.
- **`handoff`**: Transfer the output, branch state, and context from one agent to another.

## Supported Agents

| Icon | Agent | Command | Status |
| :---: | :--- | :--- | :--- |
| ✦ | **Claude Code** | `claude` | ✅ |
| ◎ | **Codex CLI** | `codex` | ✅ |
| ◆ | **Gemini CLI** | `gemini` | ✅ |
| 🚀 | **Antigravity** | `antigravity` | ✅ |
| 🦀 | **OpenClaw** | `openclaw` | ✅ |

## Architecture

- **Git Worktree Isolation:** Each agent runs in a dedicated directory and branch, ensuring no file conflicts or dirty states.
- **Adapter Pattern:** Modular design allows for easy integration of various AI agent CLIs by defining standard execution wrappers.
- **JSON File Storage:** Task metadata, PIDs, and state are persisted in local JSON files to maintain context across sessions.

## License

MIT
