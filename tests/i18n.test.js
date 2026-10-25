import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const ROOT = new URL('../extension/', import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), 'utf8');
const messages = (lang) => JSON.parse(read(`_locales/${lang}/messages.json`));
const en = messages('en');
const ru = messages('ru');
const manifest = JSON.parse(read('manifest.json'));

// Все ключи, которые код запрашивает через t('…') / t("…") и tabsCount, плюс ключи из манифеста.
const jsFiles = readdirSync(ROOT).filter((f) => f.endsWith('.js'));
const usedKeys = new Set();
for (const f of jsFiles) {
  for (const m of read(f).matchAll(/\bt\(\s*'([A-Za-z0-9_]+)'/g)) usedKeys.add(m[1]);
}
for (const m of JSON.stringify(manifest).matchAll(/__MSG_([A-Za-z0-9_]+)__/g)) usedKeys.add(m[1]);

test('язык по умолчанию задан и его файл существует', () => {
  assert.equal(manifest.default_locale, 'en');
  assert.ok(Object.keys(en).length > 0);
});

test('русский и английский переводы содержат одни и те же ключи', () => {
  assert.deepEqual(Object.keys(ru).sort(), Object.keys(en).sort());
});

test('каждый ключ из кода и манифеста есть в языке по умолчанию', () => {
  const missing = [...usedKeys].filter((k) => !(k in en));
  assert.deepEqual(missing, []);
});

test('в переводах нет лишних, неиспользуемых ключей (кроме форм множественного числа)', () => {
  const unused = Object.keys(en).filter((k) => !usedKeys.has(k) && !k.startsWith('tabsCount_'));
  assert.deepEqual(unused, []);
});

test('плейсхолдеры в обоих языках совпадают и используются в тексте', () => {
  for (const [key, entry] of Object.entries(en)) {
    const placeholders = Object.keys(entry.placeholders ?? {}).sort();
    assert.deepEqual(Object.keys(ru[key].placeholders ?? {}).sort(), placeholders, `плейсхолдеры в ${key}`);
    for (const lang of [en, ru]) {
      const used = [...lang[key].message.matchAll(/\$([A-Za-z0-9_]+)\$/g)].map((m) => m[1].toLowerCase()).sort();
      assert.deepEqual([...new Set(used)], placeholders, `текст ${key}`);
    }
  }
});

test('краткое описание влезает в лимит магазина 132 символа на обоих языках', () => {
  assert.ok(en.extDescription.message.length <= 132, String(en.extDescription.message.length));
  assert.ok(ru.extDescription.message.length <= 132, String(ru.extDescription.message.length));
});

test('в строках кода не осталось русского текста: он живёт только в _locales', () => {
  const offenders = [];
  for (const f of jsFiles) {
    read(f).split('\n').forEach((line, i) => {
      const code = line.replace(/\/\/.*$/, ''); // комментарии на русском — можно
      if (/(['"`])[^'"`\n]*[А-Яа-яЁё][^'"`\n]*\1/.test(code)) offenders.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});

test('i18n.js: форма слова выбирается по правилам языка и есть запасной вариант', async () => {
  const { tabsCount } = await import('../extension/i18n.js');
  const table = { ...Object.fromEntries(Object.entries(ru).map(([k, v]) => [k, v.message])) };
  globalThis.chrome = {
    i18n: {
      getUILanguage: () => 'ru',
      getMessage: (key, subs) => (table[key] ?? '').replace('$COUNT$', [].concat(subs ?? [])[0] ?? ''),
    },
  };
  assert.equal(tabsCount(1), '1 вкладка');
  assert.equal(tabsCount(3), '3 вкладки');
  assert.equal(tabsCount(56), '56 вкладок');
  assert.equal(tabsCount(21), '21 вкладка');
  assert.equal(tabsCount(112), '112 вкладок');
  // английский: нет форм few/many — используется other
  const enTable = Object.fromEntries(Object.entries(en).map(([k, v]) => [k, v.message]));
  delete enTable.tabsCount_few;
  globalThis.chrome.i18n.getUILanguage = () => 'en';
  globalThis.chrome.i18n.getMessage = (key, subs) => (enTable[key] ?? '').replace('$COUNT$', [].concat(subs ?? [])[0] ?? '');
  assert.equal(tabsCount(1), '1 tab');
  assert.equal(tabsCount(56), '56 tabs');
  delete globalThis.chrome;
});
