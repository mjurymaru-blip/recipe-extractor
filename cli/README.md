# YouTubeレシピ抽出CLI

YouTubeの料理動画から自動字幕を取得し、Gemini AIでレシピを構造化するCLIツールです。

## セットアップ

```bash
cd cli
npm install
cp config.json.example config.json
# config.json に Gemini API キーを設定
```

## 使い方

```bash
# レシピを追加
node index.js https://www.youtube.com/watch?v=VIDEO_ID

# レシピ一覧
node index.js --list

# レシピを削除
node index.js --delete RECIPE_ID


# ヘルプ
node index.js --help
```

## 429エラー（レート制限）が出た場合

YouTubeから「Too Many Requests」エラーが返される場合、`cookies.txt`を使用してください。

### cookies.txt の作成方法

**ブラウザがある別のPC**で以下を実行：

```bash
# Chrome の場合
yt-dlp --cookies-from-browser chrome --cookies cookies.txt --skip-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Firefox の場合
yt-dlp --cookies-from-browser firefox --cookies cookies.txt --skip-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

生成された `cookies.txt` をCLI環境の `cli/cookies.txt` にコピー。

```bash
node index.js https://www.youtube.com/watch?v=VIDEO_ID
# → 🍪 cookies.txt を使用 と表示されれば成功
```

### 注意事項

- `cookies.txt` は `.gitignore` に追加済みなので、リポジトリには含まれません
- Cookieは定期的に更新が必要な場合があります
