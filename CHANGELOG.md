# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
