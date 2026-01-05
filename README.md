# プロジェクトテンプレート

AI駆動開発のためのプロジェクトテンプレートです。

## 使い方

### 1. 新規プロジェクトの作成

```bash
# テンプレートをクローン
git clone ssh://git@192.168.1.203:30009/h.oota/project-template.git <プロジェクト名>
cd <プロジェクト名>

# Gitの履歴をリセット（新規プロジェクトとして開始）
rm -rf .git
git init
git branch -m main

# 新しいリモートを設定
git remote add origin <GiteaのURL>
```

### 2. Dual Remote設定（オプション）

GitHub公開も予定している場合：

```bash
/setup-dual-remote
```

## 含まれるファイル

```
.agent/workflows/     # Antigravityワークフロー
├── backup.md         # Giteaバックアップ
├── export-context.md # AIレビュー用エクスポート
├── publish.md        # GitHub公開
├── review-feedback.md # レビュー結果取り込み
└── setup-dual-remote.md # Dual Remote設定

docs/
└── development_workflow.md  # 開発フロードキュメント

.gitignore            # 標準的な除外設定
```

## ワークフローコマンド

| コマンド | 説明 |
|---------|------|
| `/backup` | Giteaにバックアップ |
| `/publish` | GitHubへスクッシュマージ公開 |
| `/review-feedback` | 外部AIレビュー結果を取り込む |
| `/export-context` | repomixでエクスポート |
| `/setup-dual-remote` | Dual Remote設定 |

## 詳細

開発フローの詳細は [docs/development_workflow.md](docs/development_workflow.md) を参照してください。
