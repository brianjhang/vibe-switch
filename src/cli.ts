#!/usr/bin/env node

import { Command } from 'commander';
import { runCommand } from './commands/run.js';
import { statusCommand } from './commands/status.js';
import { stopCommand } from './commands/stop.js';
import { handoffCommand } from './commands/handoff.js';
import { logCommand } from './commands/log.js';
import { watchCommand } from './commands/watch.js';
import { cleanCommand } from './commands/clean.js';
import { agentsCommand } from './commands/agents.js';
import { summaryCommand } from './commands/summary.js';
import { initCommand } from './commands/init.js';
import { configCommand } from './commands/config.js';
import { doctorCommand } from './commands/doctor.js';
import { waitCommand } from './commands/wait.js';

const program = new Command();

program
  .name('vibe')
  .description('tmux for AI Agents - start multiple Agents in parallel with one command')
  .version('1.3.1');

// vibe run "task description" --agent claude
program
  .command('run')
  .description('Start an Agent to run a task')
  .argument('<task>', 'Task description')
  .option('-a, --agent <agent>', 'AI Agent name (claude/codex/gemini/aider/opencode)', 'claude')
  .option('-b, --branch <branch>', 'Custom Git branch name')
  .action(runCommand);

// vibe status
program
  .command('status')
  .description('View the work status of all Agents')
  .action(statusCommand);

// vibe stop <branch|--all>
program
  .command('stop')
  .description('Stop an Agent')
  .argument('[branch]', 'Task branch to stop')
  .option('--all', 'Stop all Agents')
  .action(stopCommand);

// vibe log <branch>
program
  .command('log')
  .description('View recent output for an Agent task')
  .argument('<branch>', 'Task branch name')
  .option('-f, --follow', 'Follow log output in real-time')
  .action(logCommand);

// vibe watch
program
  .command('watch')
  .description('View real-time output from all Agents')
  .action(watchCommand);

// vibe clean
program
  .command('clean')
  .description('Clean up completed tasks and worktrees')
  .action(cleanCommand);

// vibe agents
program
  .command('agents')
  .description('List installed Agents')
  .action(agentsCommand);

// vibe summary <branch>
program
  .command('summary')
  .description('View an Agent work summary')
  .argument('<branch>', 'Task branch name')
  .action(summaryCommand);

// vibe init
program
  .command('init')
  .description('Initialize the project vibe-switch config')
  .action(initCommand);

// vibe config [key] [value]
program
  .command('config')
  .description('View or set config')
  .argument('[key]', 'Config key')
  .argument('[value]', 'Config value')
  .action(configCommand);

// vibe handoff <branch> --to <agent>
program
  .command('handoff')
  .description('Hand off one Agent work context to another Agent')
  .argument('<branch>', 'Source task branch name')
  .requiredOption('--to <agent>', 'Target Agent')
  .option('-m, --message <message>', 'Additional handoff notes')
  .option('--no-artifacts', 'Skip including new file contents in handoff')
  .action(handoffCommand);

// vibe wait <branch>
program
  .command('wait')
  .description('Block until a task finishes (use with && to chain)')
  .argument('<branch>', 'Task branch name to wait for')
  .action(waitCommand);

// vibe doctor
program
  .command('doctor')
  .description('Diagnose environment, agents, and config')
  .action(doctorCommand);

program.parse();
