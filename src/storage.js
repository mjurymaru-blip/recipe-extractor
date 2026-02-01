/**
 * IndexedDB ストレージモジュール
 * レシピデータの永続化
 */

const DB_NAME = 'recipe_note_db';
const DB_VERSION = 1;
const STORE_NAME = 'recipes';

let db = null;

/**
 * データベースを初期化
 */
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('IndexedDBを開けませんでした'));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // recipesストアを作成
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('createdAt', 'createdAt', { unique: false });
                store.createIndex('title', 'title', { unique: false });
            }
        };
    });
}

/**
 * DBインスタンスを取得（必要なら初期化）
 */
async function getDB() {
    if (!db) {
        await initDB();
    }
    return db;
}

/**
 * レシピを保存
 */
export async function saveRecipe(recipe) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // 更新日時を設定
        recipe.updatedAt = new Date().toISOString();

        const request = store.put(recipe);

        request.onsuccess = () => resolve(recipe);
        request.onerror = () => reject(new Error('レシピの保存に失敗しました'));
    });
}

/**
 * レシピを取得
 */
export async function getRecipe(id) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('レシピの取得に失敗しました'));
    });
}

/**
 * 全レシピを取得（新しい順）
 */
export async function getAllRecipes() {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            // 作成日時の降順でソート
            const recipes = request.result.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            resolve(recipes);
        };
        request.onerror = () => reject(new Error('レシピ一覧の取得に失敗しました'));
    });
}

/**
 * レシピを削除
 */
export async function deleteRecipe(id) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('レシピの削除に失敗しました'));
    });
}

/**
 * カテゴリでフィルタ
 */
export async function getRecipesByCategory(category) {
    const database = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('category');
        const request = index.getAll(category);

        request.onsuccess = () => {
            const recipes = request.result.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            resolve(recipes);
        };
        request.onerror = () => reject(new Error('レシピ一覧の取得に失敗しました'));
    });
}
