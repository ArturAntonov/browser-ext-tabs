import { test } from 'node:test';
import assert from 'node:assert/strict';
import { searchTabs, matchRanges, hostnameOf, tokenize, arrangeResults, displayUrl, duplicateTitles, needsFullUrl, SORT_ORDER, SORT_ACTIVITY } from '../extension/search.js';

const tab = (id, title, url, extra = {}) => ({ id, index: id, title, url, ...extra });

const tabs = [
  tab(1, 'Jira — RSI-123 Поиск по вкладкам', 'https://jira.example.com/browse/RSI-123'),
  tab(2, 'Merge request !42', 'https://gitlab.example.com/group/repo/-/merge_requests/42'),
  tab(3, 'Документация chrome.tabs', 'https://developer.chrome.com/docs/extensions/reference/api/tabs'),
  tab(4, 'Почта', 'https://www.mail.example.ru/inbox'),
];

const ids = (results) => results.map((r) => r.tab.id);

test('hostnameOf снимает www и не падает на мусоре', () => {
  assert.equal(hostnameOf('https://www.mail.example.ru/inbox'), 'mail.example.ru');
  assert.equal(hostnameOf('chrome://newtab/'), 'newtab');
  assert.equal(hostnameOf('не url'), '');
});

test('tokenize приводит к нижнему регистру и режет по пробелам', () => {
  assert.deepEqual(tokenize('  Jira   RSI '), ['jira', 'rsi']);
  assert.deepEqual(tokenize('   '), []);
});

test('ищет по заголовку без учёта регистра, включая кириллицу', () => {
  assert.deepEqual(ids(searchTabs(tabs, 'ПОЧТА')), [4]);
});

test('ищет по домену и по URL', () => {
  assert.deepEqual(ids(searchTabs(tabs, 'gitlab')), [2]);
  assert.deepEqual(ids(searchTabs(tabs, 'merge_requests')), [2]);
});

test('все токены должны совпасть', () => {
  assert.deepEqual(ids(searchTabs(tabs, 'jira поиск')), [1]);
  assert.deepEqual(ids(searchTabs(tabs, 'jira почта')), []);
});

test('совпадение в заголовке выше, чем только в URL', () => {
  const t = [
    tab(1, 'Что-то другое', 'https://example.com/tabs'),
    tab(2, 'Tabs manager', 'https://example.com/x'),
  ];
  assert.deepEqual(ids(searchTabs(t, 'tabs')), [2, 1]);
});

test('начало слова выше, чем середина слова', () => {
  const t = [tab(1, 'Prototabs', 'https://a.example'), tab(2, 'Proto tabs', 'https://b.example')];
  assert.deepEqual(ids(searchTabs(t, 'tabs')), [2, 1]);
});

test('пустой запрос: справа налево по полосе вкладок, недавность не важна', () => {
  const t = [
    tab(3, 'c', 'https://c.example', { lastAccessed: 100 }),
    tab(1, 'a', 'https://a.example', { lastAccessed: 300 }),
    tab(2, 'b', 'https://b.example', { lastAccessed: 200 }),
  ];
  assert.deepEqual(ids(searchTabs(t, '')), [3, 2, 1]);
});

test('пустой запрос: сначала по окну, потом справа налево', () => {
  const t = [
    tab(1, 'a', 'https://a.example', { windowId: 2, index: 0 }),
    tab(2, 'b', 'https://b.example', { windowId: 1, index: 5 }),
    tab(3, 'c', 'https://c.example', { windowId: 1, index: 1 }),
  ];
  assert.deepEqual(ids(searchTabs(t, '')), [2, 3, 1]);
});

test('при равном весе совпадения — правые вкладки выше', () => {
  const t = [tab(2, 'jira b', 'https://b.example'), tab(1, 'jira a', 'https://a.example')];
  assert.deepEqual(ids(searchTabs(t, 'jira')), [2, 1]);
});

test('вкладка без заголовка ищется по URL и показывает URL как заголовок', () => {
  const [r] = searchTabs([tab(1, '', 'https://loading.example/page')], 'loading');
  assert.equal(r.title, 'https://loading.example/page');
});

test('pendingUrl используется, пока url ещё пуст', () => {
  const t = [{ id: 1, index: 0, title: '', url: '', pendingUrl: 'https://pending.example/' }];
  assert.deepEqual(ids(searchTabs(t, 'pending')), [1]);
});

test('matchRanges сливает пересекающиеся совпадения', () => {
  assert.deepEqual(matchRanges('abcabc', 'abc bca'), [[0, 6]]);
  assert.deepEqual(matchRanges('Jira Jira', 'jira'), [[0, 4], [5, 9]]);
  assert.deepEqual(matchRanges('text', ''), []);
});

test('arrangeResults: без запроса — только текущая область', () => {
  const t = [tab(1, 'a', 'https://a.example', { groupId: 7 }), tab(2, 'b', 'https://b.example', { groupId: 8 })];
  const rows = arrangeResults(t, '', (x) => x.groupId === 7);
  assert.deepEqual(ids(rows), [1]);
  assert.equal(rows[0].current, true);
});

test('arrangeResults: с запросом — сначала текущая область, потом остальные', () => {
  const t = [
    tab(1, 'other jira', 'https://a.example', { groupId: 8 }),
    tab(2, 'jira', 'https://b.example', { groupId: 8 }),
    tab(3, 'про jira', 'https://c.example', { groupId: 7 }),
  ];
  const rows = arrangeResults(t, 'jira', (x) => x.groupId === 7);
  assert.deepEqual(ids(rows), [3, 2, 1]);
  assert.deepEqual(rows.map((r) => r.current), [true, false, false]);
});

test('displayUrl: без схемы и www, с путём и параметрами', () => {
  assert.equal(displayUrl('https://www.example.com/'), 'example.com');
  assert.equal(displayUrl('https://jaeger.example.com/trace/4f2a9c?uiFind=x'), 'jaeger.example.com/trace/4f2a9c?uiFind=x');
  assert.equal(displayUrl('http://localhost:8765/dev/preview.html'), 'localhost:8765/dev/preview.html');
});

test('displayUrl: кириллица в пути раскодирована', () => {
  assert.equal(displayUrl('https://ru.wikipedia.org/wiki/%D0%9A%D0%B0%D0%BB%D0%B8%D0%BD%D0%B8%D0%BD%D0%B3%D1%80%D0%B0%D0%B4'),
    'ru.wikipedia.org/wiki/Калининград');
});

test('displayUrl: длинный адрес сокращается в середине, домен и хвост видны', () => {
  const url = 'https://jaeger.example.com/search?service=dsp-enricher&limit=20&lookback=1h&operation=all&traceID=4f2a9c0b11d3';
  const out = displayUrl(url, 60);
  assert.equal(out.length, 60);
  assert.ok(out.startsWith('jaeger.example.com/search?'));
  assert.ok(out.endsWith('traceID=4f2a9c0b11d3'));
  assert.ok(out.includes('…'));
});

test('displayUrl: служебные адреса и мусор — как есть', () => {
  assert.equal(displayUrl('chrome://extensions/'), 'chrome://extensions/');
  assert.equal(displayUrl('не url'), 'не url');
});

test('needsFullUrl: адрес нужен у вкладок с одинаковыми заголовками', () => {
  const rows = [
    { title: 'Jaeger UI', host: 'jaeger.example.com' },
    { title: 'jaeger ui ', host: 'jaeger.example.com' },
    { title: 'Почта', host: 'mail.example.com' },
  ];
  const dups = duplicateTitles(rows);
  assert.equal(needsFullUrl(rows[0], '', dups), true);
  assert.equal(needsFullUrl(rows[1], '', dups), true);
  assert.equal(needsFullUrl(rows[2], '', dups), false);
});

test('needsFullUrl: адрес нужен, когда часть запроса нашлась только в адресе', () => {
  const row = { title: 'Jaeger UI', host: 'jaeger.example.com' };
  const none = new Set();
  assert.equal(needsFullUrl(row, 'jaeger', none), false);
  assert.equal(needsFullUrl(row, 'example', none), false);
  assert.equal(needsFullUrl(row, 'jaeger 4f2a', none), true);
});

const withTime = (id, title, lastAccessed, extra = {}) => tab(id, title, `https://s${id}.example/`, { lastAccessed, ...extra });

test('активность, пустой запрос: недавно просмотренные сверху, положение не важно', () => {
  const t = [withTime(1, 'a', 100), withTime(2, 'b', 300), withTime(3, 'c', 200)];
  assert.deepEqual(ids(searchTabs(t, '', SORT_ACTIVITY)), [2, 3, 1]);
  assert.deepEqual(ids(searchTabs(t, '', SORT_ORDER)), [3, 2, 1]); // порядок — как раньше, справа налево
});

test('активность: при одинаковом времени (после восстановления сессии) решает положение справа налево', () => {
  const t = [withTime(1, 'a', 500), withTime(2, 'b', 500), withTime(3, 'c', 500)];
  assert.deepEqual(ids(searchTabs(t, '', SORT_ACTIVITY)), [3, 2, 1]);
});

test('активность: вкладка без lastAccessed уходит в конец, а не ломает сортировку', () => {
  const t = [withTime(1, 'a', undefined), withTime(2, 'b', 300), withTime(3, 'c', 200)];
  assert.deepEqual(ids(searchTabs(t, '', SORT_ACTIVITY)), [2, 3, 1]);
});

test('активность, поиск: среди одинаковых заголовков первой — та, что смотрели последней', () => {
  const t = [
    withTime(1, 'Jaeger UI', 100),
    withTime(2, 'Jaeger UI', 900),
    withTime(3, 'Jaeger UI', 500),
  ];
  assert.deepEqual(ids(searchTabs(t, 'jaeger', SORT_ACTIVITY)), [2, 3, 1]);
});

test('поиск без указания сортировки — по релевантности, как раньше', () => {
  const t = [
    tab(1, 'Что-то', 'https://example.com/jaeger', { lastAccessed: 900 }),
    tab(2, 'Jaeger UI', 'https://x.example/', { lastAccessed: 100 }),
  ];
  assert.deepEqual(ids(searchTabs(t, 'jaeger')), [2, 1]);
  assert.deepEqual(ids(searchTabs(t, 'jaeger', SORT_ACTIVITY)), [1, 2]);
});

test('arrangeResults с активностью: текущая область по-прежнему выше остальных', () => {
  const t = [
    withTime(1, 'jira', 900, { groupId: 8 }),
    withTime(2, 'jira', 100, { groupId: 7 }),
    withTime(3, 'jira', 500, { groupId: 7 }),
  ];
  const rows = arrangeResults(t, 'jira', (x) => x.groupId === 7, SORT_ACTIVITY);
  assert.deepEqual(ids(rows), [3, 2, 1]);
  assert.deepEqual(rows.map((r) => r.current), [true, true, false]);
});
