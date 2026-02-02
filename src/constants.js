/**
 * カテゴリ定義（一元管理）
 * CLI/PWAで共有される分類マスター
 */
export const CATEGORIES = {
    japanese: { label: '和食', emoji: '🍱' },
    western: { label: '洋食', emoji: '🍝' },
    chinese: { label: '中華', emoji: '🥟' },
    asian: { label: 'アジアン', emoji: '🍜' },
    sweets: { label: 'スイーツ', emoji: '🍰' },
    bread: { label: 'パン', emoji: '🍞' },
    camp: { label: 'キャンプ', emoji: '🏕️' },
    other: { label: 'その他', emoji: '📦' }
};

/**
 * カテゴリIDのリスト（順序保持）
 */
export const CATEGORY_ORDER = [
    'japanese', 'western', 'chinese', 'asian',
    'sweets', 'bread', 'camp', 'other'
];

/**
 * カテゴリラベル取得（絵文字付き）
 */
export function getCategoryLabel(categoryId) {
    const cat = CATEGORIES[categoryId];
    return cat ? `${cat.emoji} ${cat.label}` : categoryId;
}

/**
 * カテゴリ絵文字のみ取得
 */
export function getCategoryEmoji(categoryId) {
    const cat = CATEGORIES[categoryId];
    return cat ? cat.emoji : '📝';
}
