# 📖 レシピノート

YouTubeの料理動画から自動字幕を取得し、レシピを構造化して表示するPWAアプリです。

## ✨ 特徴

- 🎥 **YouTube字幕からレシピ抽出** - ナレーション付き動画から材料・手順を自動抽出
- 📱 **PWA対応** - スマホにインストール可能、オフラインでも閲覧可能
- 🏕️ **ステップ表示** - 調理中に見やすいカード形式の手順表示
- 🔍 **検索・フィルター** - カテゴリ・タグで素早く検索
- ⏱️ **タイムスタンプ連動** - 各ステップから動画の該当箇所にジャンプ

## 🏗️ アーキテクチャ

```
┌─────────────────┐      ┌─────────────────┐
│   CLI ツール    │ ───► │  recipes.json   │
│  (レシピ生成)   │      │   (静的JSON)    │
└─────────────────┘      └────────┬────────┘
                                  │
                         ┌────────▼────────┐
                         │    PWA (閲覧)   │
                         │  GitHub Pages   │
                         └─────────────────┘
```

## 📦 セットアップ

### PWA（閲覧アプリ）

```bash
npm install
npm run dev      # 開発サーバー起動
npm run build    # 本番ビルド
```

### CLI（レシピ生成ツール）

```bash
cd cli
npm install
cp config.json.example config.json
# config.json に Gemini API キーを設定
```

## 🎬 使い方

### レシピを追加

```bash
cd cli
node index.js https://www.youtube.com/watch?v=VIDEO_ID
```

※ ナレーション（音声説明）のある動画を使用してください。BGMのみの動画は対応していません。

### PWAで閲覧

```bash
npm run dev
# http://localhost:3000 でアクセス
```

## 📝 対応動画の条件

- ✅ ナレーション（音声での説明）がある動画
- ✅ 日本語の自動字幕が生成される動画
- ❌ BGMのみでテロップ表示の動画
- ❌ 外国語のみの動画

## 🛠️ 技術スタック

- **PWA**: Vite + vite-plugin-pwa
- **CLI**: Node.js + yt-dlp + Gemini API
- **ホスティング**: GitHub Pages

## 📄 ライセンス

MIT
