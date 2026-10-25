// Тонкая обёртка над chrome.i18n: тексты интерфейса лежат в _locales/<язык>/messages.json.
// Язык выбирает сам браузер по своему языку; если перевода нет, берётся default_locale из манифеста.
export function t(key, ...subs) {
  const got = globalThis.chrome?.i18n?.getMessage?.(key, subs.length ? subs.map(String) : undefined);
  return got || key; // нет текста — показываем ключ, чтобы сразу было видно, чего не хватает
}

export const uiLang = () => globalThis.chrome?.i18n?.getUILanguage?.() || 'en';

// «56 вкладок» / «1 tab»: форма выбирается по правилам языка (в русском их четыре, в английском две).
export function tabsCount(n) {
  const key = `tabsCount_${new Intl.PluralRules(uiLang()).select(n)}`;
  const text = t(key, n);
  return text === key ? t('tabsCount_other', n) : text;
}
