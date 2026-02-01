/**
 * 設定管理モジュール
 * APIキー・モデル設定の保存・読み込み
 */

const STORAGE_KEY = 'recipe_note_settings';
const DEFAULT_MODEL = 'gemini-2.0-flash-001';

/**
 * 設定を取得
 */
export function getSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { apiKey: '', model: DEFAULT_MODEL };
    } catch {
        return { apiKey: '', model: DEFAULT_MODEL };
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
 * モデル名を取得
 */
export function getModel() {
    return getSettings().model || DEFAULT_MODEL;
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
 * モデルを保存
 */
export function saveModel(model) {
    const settings = getSettings();
    settings.model = model;
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
    const modelSelect = document.getElementById('modelSelect');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const backdrop = settingsModal?.querySelector('.modal__backdrop');

    // モーダルを開く
    settingsBtn?.addEventListener('click', () => {
        const settings = getSettings();
        if (apiKeyInput) apiKeyInput.value = settings.apiKey || '';
        if (modelSelect) modelSelect.value = settings.model || DEFAULT_MODEL;
        settingsModal?.classList.add('is-open');
    });

    // モーダルを閉じる
    const closeModal = () => {
        settingsModal?.classList.remove('is-open');
    };

    closeSettingsBtn?.addEventListener('click', closeModal);
    backdrop?.addEventListener('click', closeModal);

    // 設定を保存
    saveApiKeyBtn?.addEventListener('click', () => {
        const apiKey = apiKeyInput?.value?.trim() || '';
        const model = modelSelect?.value?.trim() || DEFAULT_MODEL;

        const settings = getSettings();
        settings.apiKey = apiKey;
        settings.model = model;
        saveSettings(settings);

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
