/**
 * レシピノート - メインエントリーポイント
 */

import './css/styles.css';
import { initSettings } from './settings.js';
import { initApp } from './app.js';

// アプリ初期化
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initApp();
});
