# YouTubeレシピ抽出 - タスクリスト

## Phase 1: 企画・設計
- [x] プロジェクト概要と要件整理
- [x] 実装計画の作成
- [x] AIレビュー取得（ChatGPT・Gemini・Antigravity）
- [x] ワークフロー準拠の確認・計画調整
- [x] ユーザー最終承認

## Phase 2: プロジェクト基盤
- [x] Viteプロジェクトのセットアップ
- [x] 基本HTML/CSS（デザインシステム）
- [x] PWA設定（manifest.json）
- [x] レスポンシブレイアウト

## Phase 3: MVP実装
- [x] 設定画面（APIキー入力UI）
- [x] テキスト入力UI
- [x] Gemini APIによるレシピ解析
- [x] レシピ表示UI（ステップカード形式）
- [x] IndexedDB でのローカル保存

## Phase 4: アーキテクチャ再設計 ✅
> **完了** - CLIツール + PWAビューワーの分離アーキテクチャに移行

### CLI（レシピ生成）
- [x] yt-dlp統合によるYouTube字幕自動取得
- [x] VTTパース（タイムスタンプ付き）
- [x] Gemini APIでのレシピ構造化
- [x] `public/recipes.json` への保存
- [x] config.jsonでのAPIキー管理（.gitignore対応）

### PWA（ビューワー）
- [x] `recipes.json` からの読み込み専用に変更
- [x] IndexedDB廃止、静的JSON参照
- [x] レシピ一覧表示（サムネイル付き）
- [x] YouTube動画埋め込み（各ステップ）
- [x] タイムスタンプ連動再生

## Phase 5: 管理機能強化 🔜
- [ ] レシピ検索・フィルタリング
- [ ] カテゴリ別表示
- [ ] レシピ削除機能（CLI or PWA）
- [ ] 並び替え（新しい順/古い順/カテゴリ順）

## Phase 6: オフライン & 配信
- [ ] Service Workerによるオフライン対応
- [ ] PWAインストール対応
- [ ] GitHub Pagesへの静的デプロイ
- [ ] スマホでの動作確認

## 将来拡張（Phase 7以降）
- [ ] キャンプPWAとの連携
- [ ] 献立提案アプリとの連携
- [ ] レシピ編集機能（PWA側）
- [ ] 音声操作・ジェスチャー操作
