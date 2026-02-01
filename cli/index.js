#!/usr/bin/env node
/**
 * レシピ抽出 CLIツール
 * yt-dlpでYouTube字幕を取得 → Geminiでレシピ解析
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RECIPES_FILE = path.join(__dirname, '..', 'public', 'recipes.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');

/**
 * 設定を読み込む
 */
async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { apiKey: '', model: 'gemini-2.0-flash-001' };
    }
}

/**
 * YouTubeのビデオIDを抽出
 */
function extractVideoId(url) {
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return match ? match[1] : null;
}

/**
 * yt-dlpで字幕を取得
 */
async function fetchSubtitles(videoId) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'recipe-'));
    const outputPath = path.join(tempDir, 'sub');

    return new Promise((resolve, reject) => {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        const args = [
            '--write-auto-sub',
            '--sub-lang', 'ja',
            '--skip-download',
            '--sub-format', 'vtt',
            '-o', outputPath,
            url
        ];

        console.log('  🔧 yt-dlp 実行中...');

        const proc = spawn('yt-dlp', args, { stdio: ['pipe', 'pipe', 'pipe'] });

        let stderr = '';
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', async (code) => {
            if (code !== 0) {
                await fs.rm(tempDir, { recursive: true, force: true });
                reject(new Error(`yt-dlp failed: ${stderr}`));
                return;
            }

            // 生成されたVTTファイルを探す
            try {
                const files = await fs.readdir(tempDir);
                const vttFile = files.find(f => f.endsWith('.vtt'));

                if (!vttFile) {
                    await fs.rm(tempDir, { recursive: true, force: true });
                    reject(new Error('字幕ファイルが見つかりません。この動画には字幕がない可能性があります。'));
                    return;
                }

                const vttContent = await fs.readFile(path.join(tempDir, vttFile), 'utf-8');
                await fs.rm(tempDir, { recursive: true, force: true });

                // VTTをプレーンテキストに変換
                const text = parseVTT(vttContent);
                resolve(text);
            } catch (err) {
                await fs.rm(tempDir, { recursive: true, force: true });
                reject(err);
            }
        });
    });
}

/**
 * VTTファイルをタイムスタンプ付きテキストに変換
 */
function parseVTT(vttContent) {
    const lines = vttContent.split('\n');
    const segments = [];
    const seen = new Set();
    let currentTime = null;

    for (const line of lines) {
        // メタデータをスキップ
        if (line.startsWith('WEBVTT') ||
            line.startsWith('Kind:') ||
            line.startsWith('Language:') ||
            line.trim() === '') {
            continue;
        }

        // タイムスタンプ行からタイムスタンプを抽出
        const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}|\d{2}:\d{2}\.\d{3})\s*-->/);
        if (timeMatch) {
            currentTime = formatTimestamp(timeMatch[1]);
            continue;
        }

        // HTMLタグを除去
        let text = line.replace(/<[^>]+>/g, '').trim();

        // 空行や重複を除去
        if (text && !seen.has(text)) {
            seen.add(text);
            if (currentTime) {
                segments.push(`[${currentTime}] ${text}`);
            } else {
                segments.push(text);
            }
        }
    }

    return segments.join('\n');
}

/**
 * VTTタイムスタンプを "MM:SS" 形式にフォーマット
 */
function formatTimestamp(ts) {
    const parts = ts.split(':');
    if (parts.length === 3) {
        // HH:MM:SS.mmm
        const hours = parseInt(parts[0]);
        const mins = parseInt(parts[1]);
        const secs = Math.floor(parseFloat(parts[2]));
        const totalMins = hours * 60 + mins;
        return `${totalMins}:${secs.toString().padStart(2, '0')}`;
    } else {
        // MM:SS.mmm
        const mins = parseInt(parts[0]);
        const secs = Math.floor(parseFloat(parts[1]));
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

/**
 * Gemini APIでレシピを抽出
 */
async function extractRecipeWithGemini(text, sourceUrl, config) {
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;

    const prompt = `
あなたはレシピ構造化の専門家です。以下のYouTube動画の字幕テキストからレシピ情報を抽出し、JSON形式で出力してください。

## 重要: タイムスタンプについて
- 入力テキストには [MM:SS] 形式のタイムスタンプが含まれています
- 各手順（step）に該当する開始時間のタイムスタンプを "timestamp" フィールドに設定してください
- タイムスタンプは "M:SS" または "MM:SS" 形式で出力してください

## 抽出ルール
1. 材料は name, amount, unit に分解
2. 手順は order, description, timestamp, tips に分解
3. 不明な情報は空文字列 "" とする
4. カテゴリは以下から選択: sweets, camp, daily, other
5. 話し言葉を読みやすい文章に整形すること

## 出力形式（JSONのみ出力、説明不要）
{
  "title": "レシピタイトル",
  "category": "sweets",
  "tags": ["タグ1", "タグ2"],
  "servings": "2人分",
  "prepTime": "10分",
  "cookTime": "30分",
  "ingredients": [
    { "name": "材料名", "amount": "100", "unit": "g" }
  ],
  "steps": [
    {
      "order": 1,
      "description": "手順の説明",
      "timestamp": "1:23",
      "tips": "ポイント"
    }
  ],
  "notes": "全体的なコツやメモ"
}

## 入力テキスト（YouTube字幕 + タイムスタンプ）:
${text}
`;

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
        throw new Error('APIからの応答が空です');
    }

    const recipe = JSON.parse(responseText);

    // メタデータを追加
    const videoId = extractVideoId(sourceUrl);
    recipe.id = `recipe_${Date.now()}`;
    recipe.sourceUrl = sourceUrl;
    recipe.sourceType = 'youtube';
    recipe.thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
    recipe.createdAt = new Date().toISOString();
    recipe.updatedAt = new Date().toISOString();

    return recipe;
}

/**
 * レシピ一覧を読み込む
 */
async function loadRecipes() {
    try {
        const data = await fs.readFile(RECIPES_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return { recipes: [], updatedAt: null };
    }
}

/**
 * レシピを保存
 */
async function saveRecipes(recipesData) {
    recipesData.updatedAt = new Date().toISOString();
    await fs.mkdir(path.dirname(RECIPES_FILE), { recursive: true });
    await fs.writeFile(RECIPES_FILE, JSON.stringify(recipesData, null, 2), 'utf-8');
}

/**
 * メイン処理
 */
async function main() {
    const args = process.argv.slice(2);
    const config = await loadConfig();

    // ヘルプ
    if (args.length === 0 || args[0] === '--help') {
        console.log(`
📖 レシピ抽出 CLI (yt-dlp版)

使い方:
  node index.js <YouTube URL>       YouTube動画からレシピを抽出
  node index.js --list              登録済みレシピ一覧
  node index.js --delete <番号|ID>  レシピを削除
  node index.js --config            設定を表示

例:
  node index.js https://www.youtube.com/watch?v=QMjRLpdON4E
  node index.js --delete 1
`);
        return;
    }

    // 一覧表示
    if (args[0] === '--list') {
        const data = await loadRecipes();
        console.log(`\n📋 登録済みレシピ (${data.recipes.length}件)\n`);
        data.recipes.forEach((r, i) => {
            console.log(`  ${i + 1}. [${r.id}] ${r.title}`);
        });
        console.log('\n削除: node index.js --delete <番号 or ID>');
        return;
    }

    // 削除
    if (args[0] === '--delete') {
        const target = args[1];
        if (!target) {
            console.error('❌ 削除対象を指定してください（番号またはID）');
            console.error('   例: node index.js --delete 1');
            console.error('   例: node index.js --delete recipe_1769940460110');
            process.exit(1);
        }

        const data = await loadRecipes();
        let deleteIndex = -1;

        // 番号で指定された場合
        const num = parseInt(target);
        if (!isNaN(num) && num >= 1 && num <= data.recipes.length) {
            deleteIndex = num - 1;
        } else {
            // IDで指定された場合
            deleteIndex = data.recipes.findIndex(r => r.id === target);
        }

        if (deleteIndex === -1) {
            console.error('❌ 指定されたレシピが見つかりません');
            process.exit(1);
        }

        const deleted = data.recipes.splice(deleteIndex, 1)[0];
        await saveRecipes(data);
        console.log(`🗑️ 削除しました: ${deleted.title}`);
        return;
    }

    // 設定表示
    if (args[0] === '--config') {
        console.log('\n⚙️ 現在の設定:');
        console.log(`  Model: ${config.model}`);
        console.log(`  API Key: ${config.apiKey ? '設定済み' : '未設定'}`);
        console.log(`\n設定ファイル: ${CONFIG_FILE}`);
        return;
    }

    // APIキーチェック
    if (!config.apiKey) {
        console.error('❌ APIキーが設定されていません');
        console.error(`   ${CONFIG_FILE} に apiKey を設定してください`);
        process.exit(1);
    }

    const url = args[0];
    const videoId = extractVideoId(url);

    if (!videoId) {
        console.error('❌ 有効なYouTube URLを入力してください');
        process.exit(1);
    }

    console.log(`\n🎬 動画ID: ${videoId}`);
    console.log('📝 字幕を取得中...');

    try {
        const transcript = await fetchSubtitles(videoId);
        console.log(`✅ 字幕取得完了 (${transcript.length}文字)`);

        console.log('🤖 Geminiでレシピを解析中...');
        const recipe = await extractRecipeWithGemini(transcript, url, config);

        console.log(`✅ レシピ抽出完了: ${recipe.title}`);

        // 保存
        const data = await loadRecipes();
        data.recipes.unshift(recipe);
        await saveRecipes(data);

        console.log(`💾 保存完了: ${RECIPES_FILE}`);
        console.log(`\n📦 材料 (${recipe.ingredients?.length || 0}品)`);
        recipe.ingredients?.forEach(ing => {
            console.log(`   - ${ing.name} ${ing.amount}${ing.unit}`);
        });
        console.log(`\n📋 手順 (${recipe.steps?.length || 0}ステップ)`);

    } catch (error) {
        console.error(`❌ エラー: ${error.message}`);
        process.exit(1);
    }
}

main();
