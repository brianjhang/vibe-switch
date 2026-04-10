# 🚨 Antigravity 斷線？看這裡！

## 30 秒無腦接手

當 Antigravity 到達 5 小時限額突然斷線時，打開終端執行：

```bash
cd /Users/brian/ServerAdmin/vibe-switch
codex
```

進入 Codex 後，貼上以下指令：

```
讀取 AGENTS.md 了解項目。讀取 docs/ai-skill.md 了解如何使用 vibe-switch。
然後執行 vibe status 看看有沒有正在進行的任務。
告訴我現在項目的狀態，以及你建議下一步做什麼。
```

就這樣。Codex 會自動讀取項目上下文並接手。

---

## 如果有具體任務要做

直接告訴 Codex：

```bash
codex exec --full-auto "讀取 AGENTS.md。然後做 XXX 任務。完成後 npx tsc 確認編譯通過。"
```

把 XXX 換成你要做的事。

---

## 如果要用 Gemini 接手

```bash
cd /Users/brian/ServerAdmin/vibe-switch
gemini
```

進入後貼上同樣的指令。Gemini 適合做文檔和分析類工作。

---

## 如果要用 vibe-switch 自己派任務

```bash
cd /Users/brian/ServerAdmin/vibe-switch
vibe run "你的任務描述" --agent codex
vibe watch
```

---

## 緊急聯絡方式

| 工具 | 啟動方式 | 適合做 |
|------|---------|--------|
| Codex CLI | `codex` | 寫程式、修 bug |
| Gemini CLI | `gemini` | 文檔、分析 |
| vibe-switch | `vibe run "任務" --agent codex` | 自動化派發 |
