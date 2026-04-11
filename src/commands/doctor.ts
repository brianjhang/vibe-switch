/**
 * vibe doctor - environment diagnostics
 */

import { execSync } from 'child_process';
import { getAllAdapters } from '../adapters/index.js';
import { getAllTasks, getActiveTasks } from '../core/store.js';
import { configExists } from '../core/config.js';
import { getExpandedPath } from '../utils/paths.js';

function safeExec(cmd: string): string {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      env: { ...process.env, PATH: getExpandedPath() },
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '(not found)';
  }
}

export async function doctorCommand(): Promise<void> {
  const chalk = (await import('chalk')).default;

  // Version from package.json (injected at build time is not available, read it).
  let version = '(unknown)';
  try {
    const pkg = await import('../../package.json', { with: { type: 'json' } });
    version = (pkg as any).default?.version ?? (pkg as any).version ?? '(unknown)';
  } catch {
    // Fallback: try to read from CLI --version output.
    version = safeExec('vibe --version');
  }

  // Binary path.
  const vibePath = safeExec('which vibe');

  // Node.js info.
  const nodeVersion = safeExec('node --version');
  const nodePath = safeExec('which node');

  // npm global root.
  const npmGlobalRoot = safeExec('npm root -g');

  console.log(chalk.bold.cyan('\n🩺 Vibe-Switch Doctor\n'));
  console.log(`  Version:     ${chalk.white(version)}`);
  console.log(`  Binary:      ${chalk.white(vibePath)}`);
  console.log(`  Node:        ${chalk.white(nodePath)} (${nodeVersion})`);
  console.log(`  npm global:  ${chalk.white(npmGlobalRoot)}`);

  // Config status.
  const hasConfig = configExists();
  console.log(`  Config:      ${hasConfig ? chalk.green('.vibeswitch.json (exists)') : chalk.yellow('.vibeswitch.json (not found)')}`);

  // Task stats.
  const allTasks = getAllTasks();
  const activeTasks = getActiveTasks();
  const completedTasks = allTasks.filter(t => t.status === 'completed').length;
  const stoppedTasks = allTasks.filter(t => t.status === 'stopped').length;
  const failedTasks = allTasks.filter(t => t.status === 'failed').length;
  console.log(`  Tasks:       ${chalk.green(`${activeTasks.length} running`)}, ${completedTasks} completed, ${stoppedTasks} stopped, ${failedTasks} failed`);

  // Agents.
  console.log(chalk.bold('\n  Agents:\n'));
  const adapters = getAllAdapters();
  for (const adapter of adapters) {
    const installed = await adapter.detect();
    const status = installed
      ? chalk.green('✅')
      : chalk.dim('—');
    console.log(`    ${adapter.icon} ${adapter.name.padEnd(16)} ${status}`);
  }

  console.log('');
}
