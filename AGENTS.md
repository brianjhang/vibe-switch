# Vibe-Switch Development Guide

## Project Overview
Vibe-Switch is a CLI tool positioned as "tmux for AI Agents".
It lets solo developers launch multiple agents in parallel with one command, and hand off context seamlessly when needed.

## Tech Stack
- Node.js / TypeScript
- Commander.js (CLI framework)
- simple-git (Git operations)
- chalk + cli-table3 (terminal output)
- JSON file storage (~/.vibe-switch/)

## Project Structure
```
src/
├── cli.ts              # CLI entry point
├── adapters/           # Agent adapters (detect/buildCommand)
├── commands/           # 11 commands: run, status, stop, log, watch, clean, agents, summary, init, config, handoff
├── core/               # Core: process, git, store, context, config, logStream
└── utils/              # paths, output
```

## Commands
11 commands total:

- `vibe run "<task>" --agent <agent>` — Start agent on isolated branch + worktree
- `vibe status` — View all agent task statuses
- `vibe stop [branch|--all]` — Stop one or all agents, clean up worktree
- `vibe log <branch> [-f|--follow]` — View or follow task logs
- `vibe watch` — Real-time multi-agent output streaming
- `vibe clean` — Clean up completed/stopped/failed tasks, logs, and worktrees
- `vibe agents` — List available agent adapters and install status
- `vibe summary <branch>` — View task summary, recent logs, and diff stat
- `vibe init` — Create `.vibeswitch.json` project config
- `vibe config [key] [value]` — View or set project config
- `vibe handoff <branch> --to <agent>` — Hand off context to another agent

## Coding Conventions
- TypeScript strict mode
- Use `async/await` for async operations
- Add `return` after `process.exit()` (TypeScript control flow)
- Dynamic import for chalk (ESM compatibility)
- Follow KISS principle, avoid over-engineering

## Build & Test
```bash
npx tsc                        # Compile
npx tsx src/cli.ts status      # Run directly for testing
```
