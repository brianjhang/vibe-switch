/**
 * Agent 進程管理
 */

import { spawn, ChildProcess, execSync } from 'child_process';
import { closeSync, openSync } from 'fs';
import { AgentAdapter } from '../adapters/types.js';
import { updateTask } from './store.js';
import { commandExists, ensureDir, getExpandedPath, getLogFilePath, getLogsDir } from '../utils/paths.js';

interface SpawnedAgent {
  process: ChildProcess;
  pid: number;
}

function getCommandName(command: string): string {
  return command.trim().split(/\s+/)[0] ?? '';
}

function appleScriptString(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function notifyAgentFinished(agentName: string): void {
  const script = `display notification ${appleScriptString(`${agentName} finished`)} with title ${appleScriptString('Vibe-Switch')}`;
  execSync(`osascript -e ${shellQuote(script)}`, { stdio: 'ignore' });
}

/**
 * 啟動 Agent 進程
 * 在指定的工作目錄中運行 Agent 命令
 */
export function spawnAgent(
  adapter: AgentAdapter,
  task: string,
  cwd: string,
  taskId: string,
): SpawnedAgent {
  const command = adapter.buildCommand(task, cwd);
  const commandName = getCommandName(command);
  const path = getExpandedPath();

  if (!commandName || !commandExists(commandName)) {
    throw new Error(`${adapter.name} command not found. Please install it or add it to PATH.`);
  }

  ensureDir(getLogsDir());
  const logFd = openSync(getLogFilePath(taskId), 'a');

  // 使用 shell 模式，讓各 Agent 的原生命令格式直接工作
  let child: ChildProcess | undefined;
  try {
    child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', logFd, logFd], // 在背景運行，stdout/stderr 寫入任務日誌
      detached: true,                  // 脫離父進程
      env: { ...process.env, PATH: path },
    });
  } finally {
    closeSync(logFd);
  }

  if (!child) {
    throw new Error(`無法啟動 Agent: ${adapter.name}`);
  }

  child.on('exit', (code) => {
    try {
      updateTask(taskId, {
        status: code === 0 ? 'completed' : 'failed',
        stoppedAt: Date.now(),
      });
    } catch {
      // Ignore task-store failures in the detached child handler.
    }

    try {
      notifyAgentFinished(adapter.name);
    } catch {
      // Notifications are best-effort.
    }
  });

  // 讓子進程獨立運行，不隨主進程退出
  child.unref();

  const pid = child.pid;
  if (!pid) {
    throw new Error(`無法啟動 Agent: ${adapter.name}`);
  }

  return { process: child, pid };
}

/**
 * 檢查進程是否還在運行
 */
export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0); // signal 0 只檢查不殺
    return true;
  } catch {
    return false;
  }
}

/**
 * 終止進程
 */
export function killProcess(pid: number): boolean {
  try {
    // 先嘗試 SIGTERM 優雅退出
    process.kill(pid, 'SIGTERM');

    // 等 1 秒後如果還沒死就 SIGKILL
    setTimeout(() => {
      try {
        if (isProcessRunning(pid)) {
          process.kill(pid, 'SIGKILL');
        }
      } catch {
        // 已經退出了
      }
    }, 1000);

    return true;
  } catch {
    return false;
  }
}
