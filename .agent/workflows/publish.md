---
description: GitHubへクリーンなコミットを公開する（docs除外）
---
# GitHub公開ワークフロー

開発ブランチの変更をGitHubへ公開します。**docsフォルダは自動的に除外されます。**

## 手順

// turbo
1. `git stash` で未コミットの変更を退避
// turbo
2. `git checkout -b public-clean` で一時ブランチを作成
// turbo
3. `git rm -r --cached docs/ .agent/` でdocsと.agentをGit追跡から除外
// turbo
4. `git commit -m "chore: Remove private docs for public release"` でコミット
5. ユーザーにプッシュ内容を確認する
// turbo
6. `git push public public-clean:main --force` でGitHubへプッシュ
// turbo
7. `git checkout main --force` でmainブランチに戻る
// turbo
8. `git branch -D public-clean` で一時ブランチを削除
// turbo
9. `git stash pop` で退避した変更を復元
10. 完了を報告する

## 除外されるフォルダ

- `docs/` - 内部ドキュメント
- `.agent/` - AIエージェント設定
