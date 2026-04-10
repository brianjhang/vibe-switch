/**
 * vibe handoff — 上下文交接（核心差異化命令）
 */

import { getAdapter } from '../adapters/index.js';
import { AgentId } from '../adapters/types.js';
import { getTaskByBranch, addTask, updateTask } from '../core/store.js';
import { createSnapshot, formatSnapshotAsPrompt, loadSnapshot } from '../core/context.js';
import { spawnAgent, killProcess } from '../core/process.js';
import { checkoutBranch, getCurrentBranch } from '../core/git.js';
import * as output from '../utils/output.js';

interface HandoffOptions {
  to: string;
  message?: string;
}

export async function handoffCommand(branch: string, options: HandoffOptions): Promise<void> {
  const targetAgentId = options.to as AgentId;
  const targetAdapter = getAdapter(targetAgentId);

  if (!targetAdapter) {
    await output.error(`未知的目標 Agent: ${targetAgentId}`);
    process.exit(1);
    return;
  }

  // 1. 查找源任務
  const sourceTask = getTaskByBranch(branch);
  if (!sourceTask) {
    await output.error(`找不到分支 ${branch} 對應的任務`);
    await output.info('使用 vibe status 查看所有任務');
    process.exit(1);
    return;
  }

  const sourceAdapter = getAdapter(sourceTask.agent);
  const sourceName = sourceAdapter?.name || sourceTask.agent;
  const targetName = targetAdapter.name;

  await output.info(`開始交接: ${sourceName} → ${targetName}`);

  // 2. 停止源 Agent（如果還在運行）
  if (sourceTask.status === 'running') {
    killProcess(sourceTask.pid);
    updateTask(sourceTask.id, { status: 'stopped', stoppedAt: Date.now() });
    await output.info(`已停止 ${sourceName} (PID: ${sourceTask.pid})`);
  }

  // 3. 生成上下文快照
  await output.info('正在提取上下文...');
  const snapshot = await createSnapshot(
    sourceTask.agent,
    sourceTask.task,
    sourceTask.branch,
    sourceTask.projectDir,
  );

  await output.info(`已修改文件: ${snapshot.modifiedFiles.length} 個`);
  await output.info(`Git diff: ${snapshot.gitDiff.length} 字元`);

  // 4. 格式化上下文為 prompt
  const prompt = formatSnapshotAsPrompt(snapshot, targetAgentId, options.message);

  // 5. 檢測目標 Agent
  const installed = await targetAdapter.detect();
  if (!installed) {
    await output.error(`${targetName} 未安裝`);
    // 降級方案：輸出上下文讓用戶手動複製
    await output.warn('降級方案：以下是上下文摘要，你可以手動複製給目標 Agent：');
    console.log('\n' + '─'.repeat(60));
    console.log(prompt);
    console.log('─'.repeat(60) + '\n');
    process.exit(1);
  }

  // 6. 切換到源任務的分支（確保目標 Agent 在正確分支上工作）
  try {
    await checkoutBranch(sourceTask.projectDir, sourceTask.branch);
  } catch {
    // 可能已經在正確分支上
  }

  // 7. 啟動目標 Agent，帶上上下文
  await output.info(`啟動 ${targetName}，注入上下文...`);

  // 8. 啟動目標 Agent 並記錄新任務
  const newTaskId = `${targetAgentId}-${Date.now()}`;
  const { pid } = spawnAgent(targetAdapter, prompt, sourceTask.projectDir, newTaskId);

  addTask({
    id: newTaskId,
    agent: targetAgentId,
    task: `[接力] ${sourceTask.task}`,
    branch: sourceTask.branch,  // 在同一分支上繼續
    pid,
    status: 'running',
    startedAt: Date.now(),
    projectDir: sourceTask.projectDir,
  });

  await output.success(`上下文交接完成！`);
  await output.info(`${targetName} 已在 ${sourceTask.branch} 分支上繼續工作 (PID: ${pid})`);
  await output.info('查看狀態: vibe status');
}
