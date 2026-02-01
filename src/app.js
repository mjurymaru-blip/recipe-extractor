/**
 * メインアプリケーションロジック（ビューワー専用版）
 */

import { showToast } from './settings.js';

// 現在表示中のレシピ
let currentRecipe = null;
let currentStepIndex = 0;
let allRecipes = [];

// フィルター状態
let searchQuery = '';
let categoryFilter = '';
let sortOrder = 'newest';

/**
 * アプリ初期化
 */
export async function initApp() {
  // レシピデータを読み込み
  await loadRecipesFromJSON();

  // フィルターイベントリスナー
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categoryFilter');
  const sortSelect = document.getElementById('sortOrder');

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase();
    renderRecipeList();
  });

  categorySelect?.addEventListener('change', (e) => {
    categoryFilter = e.target.value;
    renderRecipeList();
  });

  sortSelect?.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    renderRecipeList();
  });

  console.log('📖 レシピノート - 初期化完了');
}

/**
 * JSONファイルからレシピを読み込み
 */
async function loadRecipesFromJSON() {
  try {
    const response = await fetch('/recipes.json');
    if (!response.ok) {
      throw new Error('レシピファイルが見つかりません');
    }
    const data = await response.json();
    allRecipes = data.recipes || [];

    renderRecipeList();
  } catch (error) {
    console.error('レシピ読み込みエラー:', error);
    showEmptyState();
  }
}

/**
 * レシピ一覧を表示（フィルター・並び替え対応）
 */
function renderRecipeList() {
  const recipeGrid = document.getElementById('recipeGrid');
  if (!recipeGrid) return;

  // フィルタリング
  let filteredRecipes = allRecipes.filter(recipe => {
    // 検索クエリ
    if (searchQuery) {
      const titleMatch = recipe.title?.toLowerCase().includes(searchQuery);
      const ingredientMatch = recipe.ingredients?.some(
        ing => ing.name?.toLowerCase().includes(searchQuery)
      );
      const tagMatch = recipe.tags?.some(
        tag => tag.toLowerCase().includes(searchQuery)
      );
      if (!titleMatch && !ingredientMatch && !tagMatch) return false;
    }

    // カテゴリフィルター
    if (categoryFilter && recipe.category !== categoryFilter) {
      return false;
    }

    return true;
  });

  // 並び替え
  filteredRecipes = filteredRecipes.sort((a, b) => {
    switch (sortOrder) {
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'title':
        return (a.title || '').localeCompare(b.title || '', 'ja');
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });

  if (filteredRecipes.length === 0) {
    recipeGrid.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">${searchQuery || categoryFilter ? '条件に一致するレシピがありません' : 'レシピがありません'}</p>
      </div>
    `;
    return;
  }

  recipeGrid.innerHTML = filteredRecipes.map(recipe => `
    <div class="recipe-card" data-id="${recipe.id}">
      ${recipe.thumbnailUrl ? `
        <img class="recipe-card__thumbnail" src="${recipe.thumbnailUrl}" alt="${escapeHtml(recipe.title)}" loading="lazy" onerror="this.style.display='none'">
      ` : `
        <div class="recipe-card__emoji">${getCategoryEmoji(recipe.category)}</div>
      `}
      <div class="recipe-card__title">${escapeHtml(recipe.title)}</div>
      <div class="recipe-card__category">${getCategoryLabel(recipe.category)}</div>
    </div>
  `).join('');

  // カードクリックイベント
  recipeGrid.querySelectorAll('.recipe-card[data-id]').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      const recipe = allRecipes.find(r => r.id === id);
      if (recipe) {
        showStepView(recipe);
      }
    });
  });
}

/**
 * カテゴリラベルを取得
 */
function getCategoryLabel(category) {
  const labels = {
    sweets: '🍰 スイーツ',
    camp: '🏕️ キャンプ',
    daily: '🍳 日常',
    other: '📦 その他'
  };
  return labels[category] || '';
}

/**
 * 空の状態を表示
 */
function showEmptyState() {
  const recipeGrid = document.getElementById('recipeGrid');
  if (recipeGrid) {
    recipeGrid.innerHTML = `
      <div class="recipe-card recipe-card--empty">
        <p>まだレシピがありません</p>
        <p class="recipe-card__hint">PCでCLIツールを使ってレシピを追加してください</p>
      </div>
    `;
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

  // メインコンテンツを隠してステップビューを表示
  const main = document.querySelector('.main');
  if (!main) return;

  main.innerHTML = `
    <div class="step-view">
      <header class="step-view__header">
        <button class="step-view__back" id="backBtn">← 戻る</button>
        <h1 class="step-view__title">${escapeHtml(recipe.title)}</h1>
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
        <ul class="ingredients-list">
          ${(recipe.ingredients || []).map(ing => `
            <li>${escapeHtml(ing.name)} ${ing.amount || ''}${ing.unit || ''}</li>
          `).join('')}
        </ul>
      </div>

      ${recipe.sourceUrl ? `
        <a class="source-link" href="${recipe.sourceUrl}" target="_blank">
          ▶️ YouTube動画を見る
        </a>
      ` : ''}
    </div>
  `;

  // イベントリスナー
  document.getElementById('backBtn')?.addEventListener('click', showHomeView);
  document.getElementById('prevBtn')?.addEventListener('click', () => navigateStep(-1));
  document.getElementById('nextBtn')?.addEventListener('click', () => navigateStep(1));
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

  // YouTube埋め込みプレーヤー用のHTML
  const videoId = extractVideoId(recipe.sourceUrl);
  const startSeconds = step.timestamp ? parseTimestamp(step.timestamp) : 0;

  const videoEmbed = videoId ? `
    <div class="step-card__video">
      <iframe 
        src="https://www.youtube.com/embed/${videoId}?start=${startSeconds}&rel=0"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen>
      </iframe>
    </div>
  ` : '';

  return `
    ${videoEmbed}
    <div class="step-card__content">
      <p class="step-card__description">${escapeHtml(step.description)}</p>
      ${step.tips ? `<p class="step-card__tips">💡 ${escapeHtml(step.tips)}</p>` : ''}
      ${step.timestamp ? `<span class="step-card__time">🕐 ${step.timestamp}</span>` : ''}
    </div>
  `;
}

/**
 * YouTube URLからビデオIDを抽出
 */
function extractVideoId(url) {
  if (!url) return null;
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return match ? match[1] : null;
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
