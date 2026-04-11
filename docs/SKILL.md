---
name: Vibe-Switch
description: "tmux for AI Agents — Orchestrate multiple AI coding agents in parallel with one command. Run Claude Code, Codex CLI, and Gemini CLI simultaneously on isolated Git branches with seamless context handoff."
version: 1.1.0
tags:
  - ai
  - agent
  - orchestrator
  - multi-agent
  - cli
  - vibe-coding
  - tmux
  - codex
  - gemini
  - claude
---

# Vibe-Switch — tmux for AI Agents

Orchestrate multiple AI coding agents in parallel with one command. Each agent runs in its own isolated Git worktree and branch. When one agent finishes, hand off the context seamlessly to another.

## Install

```bash
npm install -g vibe-switch
```

## Quick Start

```bash
# Start agents in parallel
vibe run "Implement JWT auth middleware" --agent gemini
vibe run "Build responsive login page" --agent codex

# Monitor all agents
vibe status
vibe watch

# Hand off context between agents
vibe handoff vibe/gemini-c3d5 --to codex -m "API is ready at /api/auth"

# Cleanup
vibe stop --all
vibe clean
```

## Command Reference

| Command | Description |
|---------|-------------|
| `vibe run "<task>" --agent <agent>` | Start an agent on an isolated Git branch + worktree |
| `vibe status` | Display all tasks, status, and branches |
| `vibe watch` | Real-time multi-agent output streaming |
| `vibe log <branch> [-f]` | View or follow logs for a specific task |
| `vibe stop [branch\|--all]` | Stop one or all agents |
| `vibe handoff <branch> --to <agent>` | Transfer context to another agent |
| `vibe summary <branch>` | View task summary, logs, and diff stat |
| `vibe clean` | Clean up completed tasks, logs, and worktrees |
| `vibe agents` | List installed agent adapters |
| `vibe doctor` | Diagnose environment and agent availability |
| `vibe init` | Create project config `.vibeswitch.json` |
| `vibe config [key] [value]` | View or set project config |

## Supported Agents

| Agent | Command | Sandbox | Best For |
|:------|:--------|:-------:|:---------|
| **Claude Code** | `claude` | No | Architecture, code review, broad reasoning |
| **Codex CLI** | `codex` | Yes | Implementation, refactors, test-driven changes |
| **Gemini CLI** | `gemini` | No | Exploration, cross-checking, documentation |
| **Antigravity** | `antigravity` | No | Full-stack development, complex tasks |
| **OpenClaw** | `openclaw` | No | General purpose AI coding |

## Architecture

- **Git Worktree Isolation:** Each agent runs in a dedicated branch and directory — no file conflicts.
- **Adapter Pattern:** Modular design for easy integration of new AI agent CLIs.
- **JSON File Storage:** Task metadata persisted locally at `~/.vibe-switch/` — no database needed.

## Common Workflow Patterns

### Parallel Development

```bash
vibe run "Implement auth API and migration" --agent claude --branch vibe/auth-api
vibe run "Build auth UI and form validation" --agent codex --branch vibe/auth-ui
vibe run "Write integration tests for login" --agent gemini --branch vibe/auth-tests
vibe status
vibe watch
```

### Context Handoff

```bash
# Gemini finished the API → hand off to Codex for the frontend
vibe handoff vibe/auth-api --to codex -m "API complete. Build the client-side integration."
```

### Agent Capability Matrix

| Agent | Local Files | Network/SSH | Sandbox |
|:------|:-----------:|:-----------:|:-------:|
| claude | ✅ | ✅ | No |
| codex | ✅ | ❌ | Yes |
| gemini | ✅ | ✅ | No |

> **Important:** Codex runs in a strict sandbox — no SSH, no external APIs. Do not assign deployment or network-dependent tasks to Codex.

## Key Constraints

- Must be run from inside a Git repository.
- Worktrees are based on the current branch HEAD — **uncommitted changes are NOT visible to spawned agents**. Always `git add && git commit` before dispatching.
- Right-size your tasks: if it takes less than 5 minutes and touches one file, do it yourself.

## Links

- npm: https://www.npmjs.com/package/vibe-switch
- GitHub: https://github.com/brianjhang/vibe-switch
- Author: Brian Jhang (https://brianjhang.com)
- License: MIT
