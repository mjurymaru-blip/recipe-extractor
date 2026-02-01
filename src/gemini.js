/**
 * Gemini API連携モジュール
 * テキストからレシピを抽出・構造化
 */

import { getApiKey, getModel } from './settings.js';

/**
 * Gemini API URLを生成
 */
function getGeminiApiUrl() {
    const model = getModel();
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

/**
 * レシピ抽出プロンプト
 */
const RECIPE_EXTRACTION_PROMPT = `
あなたはレシピ構造化の専門家です。以下のテキストからレシピ情報を抽出し、JSON形式で出力してください。

## 抽出ルール
1. 材料は name, amount, unit に分解
2. 手順は order, description, tips に分解
3. 不明な情報は空文字列 "" とする
4. timestampがあれば "1:23" 形式で抽出
5. カテゴリは以下から選択: sweets, camp, daily, other

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

## 入力テキスト:
`;

/**
 * Gemini APIでレシピを抽出
 * @param {string} text - 入力テキスト（字幕や概要欄）
 * @returns {Promise<object>} - 抽出されたレシピデータ
 */
export async function extractRecipe(text) {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error('APIキーが設定されていません');
    }

    if (!text || text.trim().length === 0) {
        throw new Error('テキストが入力されていません');
    }

    const requestBody = {
        contents: [
            {
                parts: [
                    {
                        text: RECIPE_EXTRACTION_PROMPT + text
                    }
                ]
            }
        ],
        generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json'
        }
    };

    try {
        const apiUrl = getGeminiApiUrl();
        const response = await fetch(`${apiUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();

        // レスポンスからテキストを抽出
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            throw new Error('APIからの応答が空です');
        }

        // JSONをパース
        const recipe = JSON.parse(responseText);

        // IDとタイムスタンプを追加
        recipe.id = generateRecipeId();
        recipe.sourceType = 'text';
        recipe.createdAt = new Date().toISOString();
        recipe.updatedAt = new Date().toISOString();

        return recipe;
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error('レシピの解析に失敗しました。テキスト形式を確認してください。');
        }
        throw error;
    }
}

/**
 * レシピIDを生成
 */
function generateRecipeId() {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.random().toString(36).substring(2, 6);
    return `recipe_${datePart}_${randomPart}`;
}
