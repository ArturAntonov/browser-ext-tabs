// Согласие на обработку данных вкладок. Правила Chrome Web Store требуют раскрыть обработку
// в самом интерфейсе и получить явное действие пользователя до того, как данные прочитаны.
// Пока согласия нет, расширение не читает вкладки. Отметка хранится в chrome.storage.local.
export const CONSENT_KEY = 'consent';
export const CONSENT_VERSION = 1; // поднять, если изменится то, что раскрываем, — уведомление покажется снова

export async function hasConsent(area) {
  try {
    const got = await area.get(CONSENT_KEY);
    return got?.[CONSENT_KEY] === CONSENT_VERSION;
  } catch {
    return false; // хранилище недоступно — уведомление показываем каждый раз, но данные не читаем
  }
}

export async function giveConsent(area) {
  try {
    await area.set({ [CONSENT_KEY]: CONSENT_VERSION });
  } catch {
    // не записалось — просто покажем уведомление при следующем открытии
  }
}
