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

const program = new Command();

program
  .name('vibe')
  .description('AI Agent 的 tmux — 一行命令啟動多 Agent 並行工作')
  .version('1.0.0');

// vibe run "task description" --agent claude
program
  .command('run')
  .description('啟動一個 Agent 執行任務')
  .argument('<task>', '任務描述')
  .option('-a, --agent <agent>', 'AI Agent 名稱 (claude/codex/gemini/antigravity/openclaw)', 'claude')
  .option('-b, --branch <branch>', '自定義 Git 分支名')
  .action(runCommand);

// vibe status
program
  .command('status')
  .description('查看所有 Agent 的工作狀態')
  .action(statusCommand);

// vibe stop <branch|--all>
program
  .command('stop')
  .description('停止 Agent')
  .argument('[branch]', '要停止的任務分支')
  .option('--all', '停止所有 Agent')
  .action(stopCommand);

// vibe log <branch>
program
  .command('log')
  .description('查看 Agent 任務的最近輸出')
  .argument('<branch>', '任務分支名')
  .option('-f, --follow', 'Follow log output in real-time')
  .action(logCommand);

// vibe watch
program
  .command('watch')
  .description('實時查看所有 Agent 的輸出')
  .action(watchCommand);

// vibe clean
program
  .command('clean')
  .description('清理已完成的任務和 worktree')
  .action(cleanCommand);

// vibe agents
program
  .command('agents')
  .description('列出已安裝的 Agent')
  .action(agentsCommand);

// vibe summary <branch>
program
  .command('summary')
  .description('查看 Agent 的工作摘要')
  .argument('<branch>', '任務分支名')
  .action(summaryCommand);

// vibe init
program
  .command('init')
  .description('初始化項目的 vibe-switch 配置')
  .action(initCommand);

// vibe config [key] [value]
program
  .command('config')
  .description('查看或設定配置')
  .argument('[key]', '配置鍵')
  .argument('[value]', '配置值')
  .action(configCommand);

// vibe handoff <branch> --to <agent>
program
  .command('handoff')
  .description('將一個 Agent 的工作上下文交接給另一個 Agent')
  .argument('<branch>', '源任務的分支名')
  .requiredOption('--to <agent>', '目標 Agent')
  .option('-m, --message <message>', '額外的交接說明')
  .action(handoffCommand);

program.parse();
