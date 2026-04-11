# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-04-11

### Changed
- **Supported Agents cleanup**: Removed misleading `antigravity` and `openclaw` adapters. Vibe-Switch now ships with 3 verified, headless-capable CLI agents: Claude Code, Codex CLI, and Gemini CLI.
- **README clarity**: "Supported Agents" section now clearly explains that vibe-switch orchestrates terminal-native CLI tools (not GUI editors like Cursor or Windsurf), and shows the exact headless flags for each agent.
- **docs/ai-skill.md**: Updated agent IDs, capability matrix, and selection tips to reflect the 3 supported agents.

### Removed
- `antigravity` adapter (was a misleading alias for `gemini -p`).
- `openclaw` adapter (niche tool, not verified).

## [1.1.0] - 2026-04-11

### Added
- **vibe doctor command**: Environment diagnostics showing version, binary path, Node.js info, installed agents, config status, and task counts. Designed for both AI agents and human users debugging environment issues.
- **Agent Capability Matrix**: Added to `docs/ai-skill.md` — documents network/SSH capabilities and sandbox constraints for each agent, preventing incorrect task assignments (e.g., SSH tasks to sandboxed Codex).
- **"Before dispatching tasks" guide**: Three golden rules in `docs/ai-skill.md` — commit before dispatch, check agent capabilities, right-size the task.

### Changed
- **README AI entry point**: Both README.md and README.zh-TW.md now include a prominent `🤖 AI Agents` callout linking to `docs/ai-skill.md`, so AI assistants discover the machine-readable guide immediately.
- **README positioning**: Updated "Why Vibe-Switch?" to acknowledge AI orchestrators as first-class users alongside human developers.

## [0.5.0] - 2026-04-11

### Added
- **vibe summary command**: Provides detailed work summaries including runtime, log snippets, and changed files (diff stats).
- **vibe init command**: Easily initialize project-level configuration with default settings.
- **vibe config command**: View or update project settings directly from the CLI.
- **Core Configuration System**: Introduced `config.ts` module to handle project settings like `defaultAgent` and `logRetentionDays` stored in `.vibeswitch.json`.

## [0.3.0] - 2026-04-10

### Added
- **vibe clean command**: Automates the cleanup of completed, stopped, or failed tasks, including their worktrees and log files.
- **vibe agents command**: Lists all supported agent adapters and their installation status.
- **Desktop Notifications**: Added macOS desktop notifications via `osascript` to alert users when an agent task completes or fails.
- **Auto Task Status Update**: Agent task status (completed/failed) and stop time are now automatically updated upon process exit.
- **Multi-language Documentation**: Rewrote `README.md` in English and added `README.zh-TW.md` for Traditional Chinese support.

## [0.1.0] - 2026-04-10

### Added
- **Phase 0-4 MVP Commands**:
  - `vibe run <task>`: Launch an AI agent to perform a task on a dedicated Git branch.
  - `vibe status`: View current status and PID of all active agent tasks.
  - `vibe stop [branch]`: Terminate agent processes (individually or all at once with `--all`).
  - `vibe handoff <branch> --to <agent>`: Seamlessly transfer context from one agent to another.
- **Agent Adapters**: Support for 5 specialized agent CLI adapters:
  - `claude` (Anthropic Claude CLI)
  - `codex` (GitHub Copilot CLI)
  - `gemini` (Google Gemini CLI)
  - `antigravity` (Antigravity CLI)
  - `openclaw` (OpenClaw CLI)
- **New Command**:
  - `vibe log <branch>`: View recent output and logs from a specific agent task.
- **Core Infrastructure**:
  - Integrated Git workflow for automatic branch management and context preservation.
  - Process management system to track background agent tasks using PID.
  - State persistence layer for cross-session task tracking.
- **Path Expansion**: Improved support for custom `PATH` environments to ensure agent CLIs are correctly detected and executed.

### Changed
- **Error Handling**: Enhanced error reporting for command failures and missing agent CLIs.
- **Context Management**: Refined the handoff mechanism to capture more accurate project snapshots (diffs, modified files, and pending tasks).
