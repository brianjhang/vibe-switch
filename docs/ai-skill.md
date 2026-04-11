# AI Skill: Using Vibe-Switch

Use this guide when you are an AI coding assistant working in a repository where the `vibe` CLI is available.

## Overview

Vibe-Switch is a CLI orchestrator for running multiple AI coding agents in parallel. It is designed as "tmux for AI agents": one command starts an agent on an isolated Git branch and worktree, and another command can hand off the current context to a different agent.

Core capabilities:

- Start agent tasks in the background.
- Create a dedicated Git branch and worktree for each task.
- Track task metadata, branch names, PIDs, status, and runtime.
- Stream or inspect agent logs.
- Summarize a task's branch, status, recent logs, and diff stat.
- Stop one agent or all running agents.
- Clean finished task records, logs, and worktrees.
- Hand off a task from one agent to another with a generated context prompt based on modified files and Git diff.
- Detect installed agent CLIs.
- Store project config in `.vibeswitch.json`.

Data locations:

- Project config: `.vibeswitch.json`
- Task store: `~/.vibe-switch/tasks.json`
- Logs: `~/.vibe-switch/logs/<task-id>.log`
- Handoff snapshots: `~/.vibe-switch/snapshots/<branch>.json`

Supported agent IDs:

- `claude`
- `codex`
- `gemini`
- `antigravity`
- `openclaw`

## Command Reference

There are 11 commands: `run`, `status`, `stop`, `log`, `watch`, `clean`, `agents`, `summary`, `init`, `config`, and `handoff`.

### `vibe run`

Start an AI agent on a new Git branch and isolated worktree.

Syntax:

```bash
vibe run "<task>" [--agent <agent>] [--branch <branch>]
vibe run "<task>" -a <agent> -b <branch>
```

Examples:

```bash
vibe run "Implement JWT authentication middleware" --agent claude
vibe run "Build the login form and validation states" --agent codex --branch vibe/login-ui
vibe run "Write integration tests for the checkout flow" -a gemini
```

Notes:

- Must be run from a Git repository.
- The branch is generated as `vibe/<agent>-<hash>` unless `--branch` is provided.
- The agent runs in a sibling worktree directory, not in the original checkout.
- Valid agent IDs are `claude`, `codex`, `gemini`, `antigravity`, and `openclaw`.
- The current CLI default agent is `claude`; pass `--agent` for deterministic behavior.

### `vibe status`

Show all tracked agent tasks.

Syntax:

```bash
vibe status
```

Example:

```bash
vibe status
```

Notes:

- Shows agent, task, status, branch, modified file count, PID, and runtime.
- Stale `running` tasks whose process has exited are marked `completed`.
- Use the exact branch shown here when calling `log`, `summary`, `stop`, or `handoff`.

### `vibe stop`

Stop a running agent by branch, or stop all running agents.

Syntax:

```bash
vibe stop <branch>
vibe stop --all
```

Examples:

```bash
vibe stop vibe/claude-a1b2c3
vibe stop --all
```

Notes:

- Sends `SIGTERM`, then attempts `SIGKILL` if the process is still alive after a short delay.
- Marks stopped tasks as `stopped`; if the process is already gone, marks them `completed`.
- Attempts to remove the task worktree. If Git refuses because the worktree is dirty, inspect the worktree manually.

### `vibe log`

Show recent output for a task, or follow its log.

Syntax:

```bash
vibe log <branch>
vibe log <branch> --follow
vibe log <branch> -f
```

Examples:

```bash
vibe log vibe/codex-b2e4f6
vibe log vibe/codex-b2e4f6 --follow
```

Notes:

- Without `--follow`, prints the last 20 log lines.
- With `--follow`, streams new log lines until interrupted with Ctrl+C.
- The branch argument is required.

### `vibe watch`

Follow logs for all currently running agents.

Syntax:

```bash
vibe watch
```

Example:

```bash
vibe watch
```

Notes:

- Streams all active task logs with colored agent labels.
- Stops watching when you press Ctrl+C.
- This only stops the log viewer, not the agents.

### `vibe clean`

Clean task records, logs, and worktrees for tasks that are no longer running.

Syntax:

```bash
vibe clean
```

Example:

```bash
vibe clean
```

Notes:

- Cleans tasks with status `completed`, `stopped`, or `failed`.
- Cleanup is best effort; missing logs or already-removed worktrees are ignored.
- It does not target currently `running` tasks.

### `vibe agents`

List supported agent adapters and whether their CLI command is installed.

Syntax:

```bash
vibe agents
```

Example:

```bash
vibe agents
```

Notes:

- Checks `PATH`, plus common Homebrew and npm global locations.
- Use this before starting work if you do not know which agent CLIs are installed.

### `vibe doctor`

Diagnose the vibe-switch environment: version, binary path, Node.js info, installed agents, config status, and task counts.

Syntax:

```bash
vibe doctor
```

Example:

```bash
vibe doctor
```

Notes:

- Outputs the vibe binary path — useful when `run_command` environments have limited PATH.
- Shows a summary of all task counts by status.
- Use this as the first command when entering a new environment to verify everything is working.

### `vibe summary`

Show a compact summary for a task branch.

Syntax:

```bash
vibe summary <branch>
```

Example:

```bash
vibe summary vibe/gemini-c3d5e7
```

Notes:

- Shows agent, task, status, runtime, branch, recent log snippet, and changed files.
- The changed-files section is a Git diff stat against `main` when available.
- Use `vibe log <branch>` for more output and inspect the worktree directly for full uncommitted state.

### `vibe init`

Create project-level Vibe-Switch config.

Syntax:

```bash
vibe init
```

Example:

```bash
vibe init
```

Notes:

- Creates `.vibeswitch.json` in the current directory if it does not already exist.
- Default config values are `defaultAgent: "codex"` and `logRetentionDays: 7`.

### `vibe config`

Print or update project config.

Syntax:

```bash
vibe config
vibe config <key>
vibe config <key> <value>
```

Examples:

```bash
vibe config
vibe config defaultAgent
vibe config defaultAgent codex
vibe config logRetentionDays 14
```

Notes:

- With no arguments, prints the merged config as JSON.
- With only a key, prints that value.
- With key and value, updates `.vibeswitch.json`.
- Values are parsed based on default config types where possible.
- In the current implementation, `vibe run` still receives its default agent from the CLI option default, so pass `--agent` when the selected agent matters.

### `vibe handoff`

Transfer a branch and context from one agent to another.

Syntax:

```bash
vibe handoff <branch> --to <agent> [--message "<message>"]
vibe handoff <branch> --to <agent> -m "<message>"
```

Examples:

```bash
vibe handoff vibe/claude-a1b2c3 --to codex
vibe handoff vibe/gemini-c3d5e7 --to claude -m "Focus on reviewing the API boundary and finish the failing tests."
```

Notes:

- Looks up the source task by branch.
- Stops the source agent first if it is still running.
- Captures modified files and Git diff from the source worktree.
- Saves a snapshot under `~/.vibe-switch/snapshots/`.
- Starts the target agent in the same branch and worktree with the handoff prompt.
- If the target agent CLI is not installed, prints the generated prompt so it can be copied manually.

## Common Workflow Patterns

### Before dispatching tasks

1. **Commit your changes first.** Worktrees are created from the current branch HEAD. Uncommitted modifications in your working directory will NOT be visible to spawned agents.
2. **Check agent capabilities.** Not all agents can access the network or SSH. See the Agent Capability Matrix in the Agent Selection Tips section.
3. **Right-size the task.** If a task touches a single file and takes less than 5 minutes, do it yourself instead of dispatching — the overhead is not worth it.

### Check the environment first

```bash
vibe init
vibe agents
vibe status
```

Use this when entering a project. It tells you whether config exists, which agents can be started, and whether any tasks are already active.

### Parallel development

```bash
vibe run "Implement the auth API and database migration" --agent claude --branch vibe/auth-api
vibe run "Build the auth UI and form validation" --agent codex --branch vibe/auth-ui
vibe run "Write integration tests for login and logout" --agent gemini --branch vibe/auth-tests
vibe status
vibe watch
```

Use separate branches for independent work. Keep branch names explicit when you expect to reference them later.

### Monitor and inspect a task

```bash
vibe status
vibe log vibe/auth-ui
vibe log vibe/auth-ui --follow
vibe summary vibe/auth-ui
```

Use `status` to get the branch, `log` for detailed agent output, and `summary` for a quick task snapshot.

### Hand off between agents

```bash
vibe handoff vibe/auth-api --to codex -m "Continue from the existing API work. Add client-side usage examples and verify tests."
vibe status
vibe log vibe/auth-api --follow
```

Use handoff when one agent has made useful progress and another agent should continue on the same branch. This is also useful for switching from broad implementation to focused review or testing.

### Stop and clean up

```bash
vibe stop vibe/auth-tests
vibe stop --all
vibe clean
```

Use `stop` to terminate active work. Use `clean` after tasks are finished and you no longer need their Vibe-Switch task records, logs, or managed worktrees.

## Agent Selection Tips

Start with `vibe agents` and choose an installed agent. If a task has real consequences for the codebase, pass `--agent` explicitly rather than relying on defaults.

Practical selection guidance:

- Use `codex` for repository edits, implementation, refactors, and test-driven code changes.
- Use `claude` for broad reasoning, architecture tradeoffs, code review, and tasks that benefit from careful written analysis.
- Use `gemini` for broad exploration, alternate implementations, test generation, documentation passes, and cross-checking another agent's work.
- Use `antigravity` when you want the Gemini-backed adapter path used by this project. It currently detects the `gemini` CLI and runs through `gemini -p`.
- Use `openclaw` when the `openclaw` CLI is installed and you want to route a scoped task to that adapter.

Good delegation habits:

- Split work by branch and responsibility, not by overlapping edits to the same files.
- Give each agent a concrete task and a clear success condition.
- Check `vibe status` before assuming a task is still running.
- Use `vibe log <branch>` before interrupting or handing off a task.
- Use `vibe handoff` for continuation on the same branch; use a fresh `vibe run` for independent work.
- Avoid `vibe stop --all` unless the user explicitly wants all running agents stopped.

### Agent Capability Matrix

Use this table before dispatching tasks. Choosing the wrong agent for a task wastes time.

| Agent        | Local Files | Network/SSH | Sandbox | Best For |
|:-------------|:-----------:|:-----------:|:-------:|:---------|
| **claude**   | ✅          | ✅          | No      | Architecture, code review, broad reasoning |
| **codex**    | ✅          | ❌          | Yes     | Implementation, refactors, test-driven changes |
| **gemini**   | ✅          | ✅          | No      | Exploration, cross-checking, documentation |
| **antigravity** | ✅       | ✅          | No      | Full-stack orchestration, deployment |
| **openclaw** | ✅          | ❌          | Yes     | Scoped tasks via OpenClaw adapter |

Key constraints:

- **Codex runs in a strict sandbox** — no SSH, no external API calls, no network access. Do not assign deployment, remote verification, or API-calling tasks to Codex.
- **Worktrees are based on the current branch HEAD** — uncommitted changes in the main working directory are NOT visible to spawned agents. Always `git add && git commit` before dispatching.
