# 🔄 Vibe-Switch

[![npm version](https://img.shields.io/npm/v/vibe-switch.svg)](https://www.npmjs.com/package/vibe-switch)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

> **AI エージェントのための tmux** — 1つのコマンドで複数のAIエージェントを並列起動し、シームレスにコンテキストを引き継ぎます。
>
> 🤖 **AIエージェント向けガイド**：AIコーディングアシスタントの方は、[docs/ai-skill.md](./docs/ai-skill.md) で機械可読なコマンドリファレンスとオーケストレーションガイドをご確認ください。

[English](./README.md) | [繁體中文](./README.zh-TW.md) | [简体中文](./README.zh-CN.md) | 日本語

## なぜ Vibe-Switch が必要？

自分でコマンドを実行する場合でも、AIオーケストレーターにエージェントの割り振りを任せる場合でも、複数のAIエージェントを同時に管理することは認知的な悪夢です。Claude Code、Codex、Gemini CLI を同時に使って開発していると、こんな問題に直面します：

- **ターミナルの爆発**：各エージェントごとにウィンドウを開いて、切り替えの連続。
- **コンテキストの消失**：エージェントAの成果物を手動でエージェントBにコピー。
- **プロセスの混乱**：どのエージェントが何をしているか、PIDが何番か忘れてしまう。

**Vibe-Switch** は統一されたCLIを提供し、隔離された環境で複数のエージェントをオーケストレーションし、シームレスにコンテキストを引き継ぎます。

## インストール

```bash
npm install -g vibe-switch
```

ソースからインストール：

```bash
git clone https://github.com/brianjhang/vibe-switch.git
cd vibe-switch
npm install
npm run build
npm link
```

> 💡 インストール後、CLI コマンドは **`vibe`** です（`vibe-switch` ではありません）。`vibe` と `vibe-switch` の両方が使用できますが、すべての例では `vibe` を使用しています。

## クイックスタート

### 1. 複数エージェントの起動

```bash
# バックエンドタスクをGeminiに
vibe run "JWT認証ミドルウェアを実装" --agent gemini

# フロントエンドタスクをCodexに
vibe run "Reactでレスポンシブなログインページを構築" --agent codex
```

### 2. ステータス確認

```bash
vibe status
```

| エージェント | タスク | ステータス | ブランチ | 変更数 |
| :--- | :--- | :--- | :--- | :--- |
| ◎ Codex | ログインページ構築... | 🟢 running | vibe/codex-b2e4 | 3 |
| ◆ Gemini | JWT実装... | ✅ done | vibe/gemini-c3d5 | 2 |

### 3. リアルタイム監視

```bash
vibe watch    # 全エージェントの出力をカラーラベル付きでリアルタイム表示
```

### 4. ログ確認

```bash
vibe log vibe/codex-b2e4 -f    # 特定エージェントの出力をtail
```

### 5. シームレスな引き継ぎ

GeminiでバックエンドAPIが完了？コンテキストをそのままCodexに渡してUIを構築：

```bash
vibe handoff vibe/gemini-c3d5 --to codex -m "APIは /api/auth で準備完了"
```

### 6. 停止とクリーンアップ

```bash
vibe stop --all    # 全エージェントを停止
vibe clean         # 完了したタスクとworktreeをクリーンアップ
```

## 全コマンド一覧

| コマンド | 説明 |
|---------|------|
| `vibe run` | 隔離されたGit Worktreeでエージェントタスクを開始 |
| `vibe status` | 全タスクのステータス・ブランチ・PIDを一覧表示 |
| `vibe watch` | 全実行中エージェントのリアルタイムログビューア |
| `vibe log` | 特定タスクのログを表示/フォロー（`-f` でリアルタイム） |
| `vibe stop` | 単一またはすべてのエージェントを停止 |
| `vibe handoff` | あるエージェントのコンテキストを別のエージェントに引き継ぎ |
| `vibe summary` | エージェントの作業を自動要約（ログ + git diff） |
| `vibe clean` | 完了タスク・ログ・worktreeをクリーンアップ |
| `vibe agents` | インストール済みエージェントとステータスを一覧表示 |
| `vibe init` | プロジェクトレベルのvibe-switch設定を初期化 |
| `vibe config` | 設定の表示または更新 |

## 対応エージェント

Vibe-Switchがオーケストレーションするのは**ターミナルネイティブなAIコーディングCLIツール**——タスクを受け取りヘッドレスプロセスとして自律的に実行できるツールです。GUIエディタ（Cursor、Windsurfなど）はディスパッチできませんが、それらの内蔵ターミナルから `vibe` コマンドを実行することは可能です。

| アイコン | エージェント | CLIコマンド | ヘッドレスフラグ |
| :---: | :--- | :--- | :--- |
| ✦ | **Claude Code** | `claude` | `-p "task"` |
| ◎ | **Codex CLI** | `codex` | `exec --full-auto "task"` |
| ◆ | **Gemini CLI** | `gemini` | `-p "task"` |

> 💡 **エージェントの追加**：モジュラーなAdapterパターンにより、新しいCLIエージェントの統合が容易です。`src/adapters/` ディレクトリを参照してください。

## アーキテクチャ

- **Git Worktree 隔離**：各エージェントは専用のディレクトリとブランチで動作し、ファイル競合ゼロ。
- **Adapter パターン**：新しいエージェントの追加はアダプタファイル1つで完了。
- **JSON ファイルストレージ**：タスクメタデータ・PID・状態はローカルに永続化——データベース不要。

## 作者

[Brian Jhang](https://brianjhang.com) が開発 — 一人会社時代のためのツールを構築中。

## ライセンス

[MIT](./LICENSE)
