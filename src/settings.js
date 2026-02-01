/**
 * 設定管理モジュール
 * APIキーの保存・読み込み
 */

const STORAGE_KEY = 'recipe_note_settings';

/**
 * 設定を取得
 */
export function getSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { apiKey: '' };
    } catch {
        return { apiKey: '' };
    }
}

/**
 * 設定を保存
 */
export function saveSettings(settings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

/**
 * APIキーを取得
 */
export function getApiKey() {
    return getSettings().apiKey || '';
}

/**
 * APIキーを保存
 */
export function saveApiKey(apiKey) {
    const settings = getSettings();
    settings.apiKey = apiKey;
    saveSettings(settings);
}

/**
 * APIキーが設定されているか確認
 */
export function hasApiKey() {
    return !!getApiKey();
}

/**
 * 設定UIの初期化
 */
export function initSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const backdrop = settingsModal?.querySelector('.modal__backdrop');

    // モーダルを開く
    settingsBtn?.addEventListener('click', () => {
        apiKeyInput.value = getApiKey();
        settingsModal?.classList.add('is-open');
    });

    // モーダルを閉じる
    const closeModal = () => {
        settingsModal?.classList.remove('is-open');
    };

    closeSettingsBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    // APIキーを保存
    saveApiKeyBtn?.addEventListener('click', () => {
        const apiKey = apiKeyInput?.value?.trim() || '';
        saveApiKey(apiKey);
        closeModal();
        showToast('設定を保存しました', 'success');
    });
}

/**
 * トースト通知を表示
 */
export function showToast(message, type = 'success') {
    // 既存のトーストを削除
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // 新しいトーストを作成
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // 表示
    requestAnimationFrame(() => {
        toast.classList.add('is-visible');
    });

    // 3秒後に非表示
    setTimeout(() => {
        toast.classList.remove('is-visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
