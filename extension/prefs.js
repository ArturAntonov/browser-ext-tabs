// Настройки, которые запоминаются между открытиями окна (chrome.storage.local). Данных о вкладках здесь нет.
import { SORT_ORDER, SORT_ACTIVITY } from './search.js';

const SORT_KEY = 'sort';

// Как сортировать список: 'order' (по умолчанию) или 'activity'. Любое другое значение — по умолчанию.
export async function getSort(area) {
  try {
    const got = await area.get(SORT_KEY);
    return got?.[SORT_KEY] === SORT_ACTIVITY ? SORT_ACTIVITY : SORT_ORDER;
  } catch {
    return SORT_ORDER; // хранилище недоступно — работаем с умолчанием
  }
}

export async function setSort(area, mode) {
  try {
    await area.set({ [SORT_KEY]: mode === SORT_ACTIVITY ? SORT_ACTIVITY : SORT_ORDER });
  } catch {
    // не записалось — в следующий раз будет порядок по умолчанию
  }
}
