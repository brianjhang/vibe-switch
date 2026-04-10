/**
 * Agent process management.
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
 * Start an Agent process.
 * Run the Agent command in the specified working directory.
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

  // Use shell mode so each Agent's native command format works directly.
  let child: ChildProcess | undefined;
  try {
    child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', logFd, logFd], // Run in the background and write stdout/stderr to the task log.
      detached: true,                  // Detach from the parent process.
      env: { ...process.env, PATH: path },
    });
  } finally {
    closeSync(logFd);
  }

  if (!child) {
    throw new Error(`Unable to start Agent: ${adapter.name}`);
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

  // Let the child process run independently after the main process exits.
  child.unref();

  const pid = child.pid;
  if (!pid) {
    throw new Error(`Unable to start Agent: ${adapter.name}`);
  }

  return { process: child, pid };
}

/**
 * Check whether a process is still running.
 */
export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0); // Signal 0 only checks, without killing.
    return true;
  } catch {
    return false;
  }
}

/**
 * Terminate a process.
 */
export function killProcess(pid: number): boolean {
  try {
    // Try SIGTERM first for a graceful exit.
    process.kill(pid, 'SIGTERM');

    // After 1 second, use SIGKILL if it is still alive.
    setTimeout(() => {
      try {
        if (isProcessRunning(pid)) {
          process.kill(pid, 'SIGKILL');
        }
      } catch {
        // It has already exited.
      }
    }, 1000);

    return true;
  } catch {
    return false;
  }
}
