# Vibe-Switch 功能改進提案 — 來自 LINE 插件協作實戰

> **背景**：2026-04-14，使用 vibe-switch 協調 Codex CLI + Antigravity 完成了 Hermes Agent LINE 插件開發（1,251 行 Python 代碼）。以下是從實戰中發現的不足和改進建議。
>
> **核心洞見**：多 Agent 協作的瓶頸不在代碼生成（Codex 16 分鐘產出 80% 核心代碼），而在 **交接 (handoff)、整合 (integration)、驗證 (verification)** 三個環節，它們佔了總時間的 70%。

---

## 問題總覽

| # | 問題 | 嚴重度 | 影響 |
|---|---|---|---|
| P1 | Handoff 只傳 git diff，不帶產出檔案 | 🔴 高 | 接手的 agent 拿不到上一個 agent 新建的檔案 |
| P2 | Agent 之間無法感知工作狀態 | 🟡 中 | 不知道對方何時完成、產出了什麼 |
| P3 | 無 pipeline / DAG 機制 | 🟡 中 | 所有 task 都是獨立的，無法串接 |
| P4 | 缺少 retrospective 工具 | 🟢 低 | 無法自動回顧多 agent 協作效果 |

---

## 提案 1：Handoff Artifacts 自動收集

### 現狀

`handoff.ts` 的 `createSnapshot()` 收集 git diff 和 modified files 清單，但：
- **不包含新建檔案的完整內容**（只有 diff）
- Agent 產出的「非 git tracked」檔案（如 log、臨時報告）完全遺失
- 接手的 agent 需要人工提供這些內容

### 建議改動

**修改 `src/core/context.ts`**：

在 `createSnapshot()` 中增加 `artifacts` 欄位：

```typescript
interface ContextSnapshot {
  // ... existing fields ...
  artifacts: ArtifactEntry[];  // 新增
}

interface ArtifactEntry {
  path: string;       // 相對於 worktree 的路徑
  content: string;    // 檔案完整內容（text files only）
  sizeBytes: number;
  isNew: boolean;     // git status == '??' or 'A'
}
```

收集邏輯：
1. `git status --porcelain` 取得所有 new/modified files
2. 對 new files (`??`, `A`)，讀取完整內容（限 50KB 以下的 text file）
3. 對 modified files (`M`)，保留 diff（現有邏輯）
4. 寫入 `.vibe/handoffs/<task-id>.json`

**修改 `src/commands/handoff.ts`**：

```typescript
// 新增 --include-artifacts flag（預設 true）
interface HandoffOptions {
  to: string;
  message?: string;
  includeArtifacts?: boolean;  // 新增，預設 true
}
```

在 `formatSnapshotAsPrompt()` 中，把 artifacts 的完整內容附加到 prompt 裡：

```
## New Files Created by Previous Agent

### path/to/new_file.py
\`\`\`python
... (complete file content) ...
\`\`\`
```

### 預期效果

```bash
# Before: 接手 agent 只看到 "1,251 lines added"
vibe handoff vibe/codex-xxx --to gemini

# After: 接手 agent 拿到完整的 line.py 內容
vibe handoff vibe/codex-xxx --to gemini
# → Prompt includes full content of all new files
```

### 涉及檔案

| 檔案 | 改動 |
|---|---|
| `src/core/context.ts` | `createSnapshot()` 增加 artifact 收集 |
| `src/commands/handoff.ts` | 新增 `--include-artifacts` flag |
| `src/utils/output.ts` | 新增 artifact 摘要輸出 |

---

## 提案 2：Task Pipeline（`--after` 參數）

### 現狀

所有 `vibe run` 啟動的 task 都是獨立的，沒有依賴關係。實際開發中，常見的模式是：

```
Agent A (寫 spec) → Agent B (寫 code) → Agent A (整合部署)
```

目前只能手動等 A 完成，再手動啟動 B。

### 建議改動

**修改 `src/commands/run.ts`**：

```typescript
interface RunOptions {
  agent: string;
  // ... existing options ...
  after?: string;  // 新增：等待指定 branch/task 完成後自動啟動
}
```

實作邏輯：
1. 如果指定了 `--after`，不立即 spawn agent
2. 輪詢 source task 的狀態（或用 fs.watch 監聽 `.vibe/tasks.json`）
3. Source task status 變為 `done` 時，自動收集 snapshot + 啟動 target agent

```bash
# 用法
vibe run "Write LINE adapter based on docs/LINE_PLUGIN_SPEC.md" \
  --agent codex \
  --after vibe/gemini-spec-task
```

**新增 `src/core/pipeline.ts`**：

```typescript
interface PipelineStep {
  agent: AgentId;
  task: string;
  dependsOn?: string;  // task id or branch
}

// 監聽依賴完成
function watchForCompletion(taskId: string): Promise<void>;
```

### 涉及檔案

| 檔案 | 改動 |
|---|---|
| `src/commands/run.ts` | 新增 `--after` 參數 + 等待邏輯 |
| `src/core/pipeline.ts` | [NEW] pipeline 監聽與觸發 |
| `src/core/store.ts` | 增加 task 狀態變更事件 |
| `src/cli.ts` | 註冊 `--after` option |

---

## 提案 3：Cross-Agent Timeline（`vibe watch` 增強）

### 現狀

`vibe watch` 顯示各 agent 的即時 log，但沒有統一時間線。

### 建議改動

**修改 `src/commands/watch.ts`**：

在現有的多 pane log 之上，加一個 **unified timeline** 模式：

```bash
vibe watch --timeline
```

輸出格式：
```
[11:14:23] ◆ Gemini  │ 📝 spec 完成 (504 行)
[11:16:01] ◎ Codex   │ 🚀 開始寫 line.py...
[11:32:45] ◎ Codex   │ ✅ line.py 完成 (1,251 行)
[11:33:12] ◆ Gemini  │ 📦 開始整合 patch...
[11:45:30] ◆ Gemini  │ 🔧 patch 1-7 套用完成
[11:50:00] ◆ Gemini  │ 🐳 Docker build 開始...
```

資料來源：
- 已有的 log files（`.vibe/logs/`）
- task status 變更事件
- git commit timestamps

### 涉及檔案

| 檔案 | 改動 |
|---|---|
| `src/commands/watch.ts` | 新增 `--timeline` flag + 統一時間線渲染 |
| `src/core/logStream.ts` | 增加跨 task log 合併 |

---

## 提案 4：`vibe retrospective` 自動復盤

### 新增指令

```bash
vibe retrospective                    # 回顧最近一組協作
vibe retrospective vibe/codex-xxx vibe/gemini-xxx  # 指定 tasks
```

自動生成：
1. **時間線**：各 agent 的開始/結束時間
2. **產出統計**：每個 agent 新增/修改的行數
3. **交接記錄**：handoff 的時間點和內容
4. **效率分析**：code 生成 vs 整合 vs 等待的時間比例
5. **改進建議**：基於分析自動建議

輸出 markdown 格式，可直接存檔。

### 涉及檔案

| 檔案 | 改動 |
|---|---|
| `src/commands/retrospective.ts` | [NEW] 新指令 |
| `src/cli.ts` | 註冊新指令 |

---

## 實作優先級建議

| 優先級 | 提案 | 理由 |
|---|---|---|
| 🔴 P0 | **Handoff Artifacts** | 當前最大痛點，直接影響 handoff 品質 |
| 🟡 P1 | **Task Pipeline** | 減少人工等待，實現半自動協作 |
| 🟢 P2 | **Timeline Watch** | 提升可觀察性，UX 改善 |
| 🟢 P3 | **Retrospective** | 長期改進用，非急迫 |

建議先做 **Handoff Artifacts**，這是一個低成本高回報的改動（主要改 `context.ts` + `handoff.ts`），能立即解決最大的痛點。

---

## 相關文件

- 完整復盤報告：詳見本次協作的 Antigravity conversation artifact
- LINE 插件規格書（協作範例）：`/Users/brian/ServerAdmin/pve/docs/LINE_PLUGIN_SPEC.md`
- 現有 handoff 實作：`src/commands/handoff.ts`（108 行）
- 現有 context 收集：`src/core/context.ts`（~100 行）
