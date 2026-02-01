/**
 * メインアプリケーションロジック
 */

import { hasApiKey, showToast } from './settings.js';

/**
 * アプリ初期化
 */
export function initApp() {
    const extractBtn = document.getElementById('extractBtn');
    const urlInput = document.getElementById('urlInput');
    const textInput = document.getElementById('textInput');

    // 抽出ボタンのクリック
    extractBtn?.addEventListener('click', async () => {
        // APIキーチェック
        if (!hasApiKey()) {
            showToast('設定からAPIキーを入力してください', 'error');
            return;
        }

        const url = urlInput?.value?.trim() || '';
        const text = textInput?.value?.trim() || '';

        // 入力チェック
        if (!url && !text) {
            showToast('URLまたはテキストを入力してください', 'error');
            return;
        }

        // TODO: Phase 2で実装
        // - URLからの字幕取得（Phase 3）
        // - テキストからのレシピ抽出
        // - ステップカード表示

        showToast('レシピ抽出機能は次のPhaseで実装予定です', 'success');
    });

    console.log('📖 レシピノート - 初期化完了');
}
