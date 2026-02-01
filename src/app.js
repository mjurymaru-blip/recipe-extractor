/**
 * メインアプリケーションロジック
 */

import { hasApiKey, showToast } from './settings.js';
import { extractRecipe } from './gemini.js';
import { initDB, saveRecipe, getAllRecipes, getRecipe, deleteRecipe } from './storage.js';

// 現在表示中のレシピ
let currentRecipe = null;
let currentStepIndex = 0;
let isEditMode = false;

/**
 * アプリ初期化
 */
export async function initApp() {
  // IndexedDB初期化
  await initDB();

  const extractBtn = document.getElementById('extractBtn');

  // 抽出ボタンのクリック
  extractBtn?.addEventListener('click', handleExtract);

  // レシピ一覧を読み込み
  await loadRecipeList();

  console.log('📖 レシピノート - 初期化完了');
}

/**
 * レシピ抽出処理
 */
async function handleExtract() {
  const urlInput = document.getElementById('urlInput');
  const textInput = document.getElementById('textInput');
  const extractBtn = document.getElementById('extractBtn');

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

  // テキストがある場合はそれを使用、なければURL
  const inputText = text || `YouTube URL: ${url}`;

  // UIをローディング状態に
  extractBtn.disabled = true;
  extractBtn.textContent = '⏳ 解析中...';

  try {
    // Gemini APIでレシピ抽出
    const recipe = await extractRecipe(inputText);

    // URLがあればセット
    if (url) {
      recipe.sourceUrl = url;
      recipe.sourceType = 'youtube';
      // サムネイルURLを生成
      const videoId = extractVideoId(url);
      if (videoId) {
        recipe.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      }
    }

    // 保存
    await saveRecipe(recipe);

    // 入力をクリア
    if (urlInput) urlInput.value = '';
    if (textInput) textInput.value = '';

    // 一覧を更新
    await loadRecipeList();

    // ステップビューを表示
    showStepView(recipe);

    showToast('レシピを抽出しました！', 'success');
  } catch (error) {
    console.error('抽出エラー:', error);
    showToast(error.message || 'レシピの抽出に失敗しました', 'error');
  } finally {
    extractBtn.disabled = false;
    extractBtn.textContent = '✨ レシピを抽出';
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
 * レシピ一覧を読み込み
 */
async function loadRecipeList() {
  const recipeGrid = document.getElementById('recipeGrid');
  if (!recipeGrid) return;

  try {
    const recipes = await getAllRecipes();

    if (recipes.length === 0) {
      recipeGrid.innerHTML = `
        <div class="recipe-card recipe-card--empty">
          <p>まだレシピがありません</p>
          <p class="recipe-card__hint">上のフォームからレシピを抽出してください</p>
        </div>
      `;
      return;
    }

    recipeGrid.innerHTML = recipes.map(recipe => `
      <div class="recipe-card" data-id="${recipe.id}">
        <div class="recipe-card__emoji">${getCategoryEmoji(recipe.category)}</div>
        <div class="recipe-card__title">${escapeHtml(recipe.title)}</div>
      </div>
    `).join('');

    // カードクリックイベント
    recipeGrid.querySelectorAll('.recipe-card[data-id]').forEach(card => {
      card.addEventListener('click', async () => {
        const id = card.dataset.id;
        const recipe = await getRecipe(id);
        if (recipe) {
          showStepView(recipe);
        }
      });
    });
  } catch (error) {
    console.error('レシピ一覧の読み込みエラー:', error);
  }
}

/**
 * カテゴリに応じた絵文字を取得
 */
function getCategoryEmoji(category) {
  const emojis = {
    sweets: '🍰',
    camp: '🏕️',
    daily: '🍳',
    other: '📝'
  };
  return emojis[category] || '📝';
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

/**
 * ステップビューを表示
 */
function showStepView(recipe) {
  currentRecipe = recipe;
  currentStepIndex = 0;
  isEditMode = false;

  // メインコンテンツを隠してステップビューを表示
  const main = document.querySelector('.main');
  if (!main) return;

  main.innerHTML = `
    <div class="step-view">
      <header class="step-view__header">
        <button class="step-view__back" id="backBtn">← 戻る</button>
        <h1 class="step-view__title">${escapeHtml(recipe.title)}</h1>
        <button class="step-view__edit" id="editBtn">✏️ 編集</button>
      </header>

      <div class="step-view__progress">
        <span class="step-view__progress-text" id="progressText">
          Step 1 / ${recipe.steps?.length || 0}
        </span>
        <div class="step-view__progress-bar">
          <div class="step-view__progress-fill" id="progressFill" style="width: ${100 / (recipe.steps?.length || 1)}%"></div>
        </div>
      </div>

      <div class="step-card" id="stepCard">
        ${renderStep(recipe, 0)}
      </div>

      <div class="step-view__nav">
        <button class="btn btn--secondary" id="prevBtn" disabled>◀ 前へ</button>
        <button class="btn btn--primary" id="nextBtn">次へ ▶</button>
      </div>

      <div class="ingredients-section">
        <h3>📦 材料 (${recipe.servings || '分量不明'})</h3>
        <ul class="ingredients-list" id="ingredientsList">
          ${(recipe.ingredients || []).map((ing, i) => `
            <li data-index="${i}">${escapeHtml(ing.name)} ${ing.amount || ''}${ing.unit || ''}</li>
          `).join('')}
        </ul>
      </div>

      <div class="recipe-actions" id="recipeActions">
        <button class="btn btn--danger" id="deleteBtn">🗑️ レシピを削除</button>
      </div>
    </div>
  `;

  // イベントリスナー
  document.getElementById('backBtn')?.addEventListener('click', showHomeView);
  document.getElementById('prevBtn')?.addEventListener('click', () => navigateStep(-1));
  document.getElementById('nextBtn')?.addEventListener('click', () => navigateStep(1));
  document.getElementById('editBtn')?.addEventListener('click', toggleEditMode);
  document.getElementById('deleteBtn')?.addEventListener('click', handleDeleteRecipe);
}

/**
 * 編集モードの切り替え
 */
function toggleEditMode() {
  isEditMode = !isEditMode;
  const editBtn = document.getElementById('editBtn');

  if (isEditMode) {
    editBtn.textContent = '💾 保存';
    editBtn.classList.add('is-editing');
  } else {
    editBtn.textContent = '✏️ 編集';
    editBtn.classList.remove('is-editing');
    // 保存処理
    saveCurrentRecipe();
  }

  // ステップカードを再レンダリング
  const stepCard = document.getElementById('stepCard');
  if (stepCard) {
    stepCard.innerHTML = renderStep(currentRecipe, currentStepIndex);
    if (isEditMode) {
      attachEditListeners();
    }
  }
}

/**
 * 編集用イベントリスナーを設定
 */
function attachEditListeners() {
  const descriptionEl = document.getElementById('stepDescription');
  const tipsEl = document.getElementById('stepTips');

  descriptionEl?.addEventListener('input', (e) => {
    if (currentRecipe?.steps?.[currentStepIndex]) {
      currentRecipe.steps[currentStepIndex].description = e.target.value;
    }
  });

  tipsEl?.addEventListener('input', (e) => {
    if (currentRecipe?.steps?.[currentStepIndex]) {
      currentRecipe.steps[currentStepIndex].tips = e.target.value;
    }
  });
}

/**
 * 現在のレシピを保存
 */
async function saveCurrentRecipe() {
  if (!currentRecipe) return;

  try {
    await saveRecipe(currentRecipe);
    showToast('レシピを保存しました', 'success');
  } catch (error) {
    console.error('保存エラー:', error);
    showToast('保存に失敗しました', 'error');
  }
}

/**
 * レシピを削除
 */
async function handleDeleteRecipe() {
  if (!currentRecipe) return;

  if (!confirm('このレシピを削除してもよろしいですか？')) {
    return;
  }

  try {
    await deleteRecipe(currentRecipe.id);
    showToast('レシピを削除しました', 'success');
    showHomeView();
  } catch (error) {
    console.error('削除エラー:', error);
    showToast('削除に失敗しました', 'error');
  }
}

/**
 * ステップをレンダリング
 */
function renderStep(recipe, index) {
  const steps = recipe.steps || [];
  if (steps.length === 0) {
    return '<p class="step-card__empty">手順がありません</p>';
  }

  const step = steps[index];
  if (!step) return '';

  if (isEditMode) {
    // 編集モード
    return `
      <div class="step-card__content step-card__content--edit">
        <label class="edit-label">手順</label>
        <textarea 
          id="stepDescription" 
          class="edit-textarea"
          rows="4"
        >${escapeHtml(step.description)}</textarea>
        
        <label class="edit-label">💡 ポイント</label>
        <input 
          type="text"
          id="stepTips" 
          class="edit-input"
          value="${escapeHtml(step.tips || '')}"
          placeholder="ポイントを入力..."
        >
      </div>
    `;
  }

  // 通常表示モード
  return `
    <div class="step-card__content">
      <p class="step-card__description">${escapeHtml(step.description)}</p>
      ${step.tips ? `<p class="step-card__tips">💡 ${escapeHtml(step.tips)}</p>` : ''}
      ${step.timestamp && recipe.sourceUrl ? `
        <a class="step-card__timestamp" href="${recipe.sourceUrl}&t=${parseTimestamp(step.timestamp)}" target="_blank">
          ▶️ ${step.timestamp} で再生
        </a>
      ` : ''}
    </div>
  `;
}

/**
 * タイムスタンプを秒数に変換
 */
function parseTimestamp(timestamp) {
  if (!timestamp) return 0;
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * ステップナビゲーション
 */
function navigateStep(direction) {
  if (!currentRecipe || !currentRecipe.steps) return;

  // 編集中なら保存してから移動
  if (isEditMode) {
    // 現在の入力値を反映
    const descriptionEl = document.getElementById('stepDescription');
    const tipsEl = document.getElementById('stepTips');
    if (descriptionEl && currentRecipe.steps[currentStepIndex]) {
      currentRecipe.steps[currentStepIndex].description = descriptionEl.value;
    }
    if (tipsEl && currentRecipe.steps[currentStepIndex]) {
      currentRecipe.steps[currentStepIndex].tips = tipsEl.value;
    }
  }

  const totalSteps = currentRecipe.steps.length;
  currentStepIndex = Math.max(0, Math.min(totalSteps - 1, currentStepIndex + direction));

  // UI更新
  const stepCard = document.getElementById('stepCard');
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (stepCard) {
    stepCard.innerHTML = renderStep(currentRecipe, currentStepIndex);
    if (isEditMode) {
      attachEditListeners();
    }
  }
  if (progressText) {
    progressText.textContent = `Step ${currentStepIndex + 1} / ${totalSteps}`;
  }
  if (progressFill) {
    progressFill.style.width = `${((currentStepIndex + 1) / totalSteps) * 100}%`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentStepIndex === 0;
  }
  if (nextBtn) {
    nextBtn.textContent = currentStepIndex === totalSteps - 1 ? '完了 ✓' : '次へ ▶';
  }
}

/**
 * ホーム画面に戻る
 */
function showHomeView() {
  location.reload();
}
