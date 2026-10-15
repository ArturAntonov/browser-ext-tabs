// Подмена chrome.* для просмотра popup в обычной вкладке. ?nogroups — браузер без API групп,
// ?ungrouped — активная вкладка вне группы, ?yandex — группы браузера не видны расширению,
// ?store — правдоподобный набор вкладок для скриншотов в каталог.
(() => {
  const params = new URLSearchParams(location.search);
  const noGroups = params.has('nogroups');
  const ungrouped = params.has('ungrouped');
  // ?yandex — как в Яндекс Браузере: tabGroups есть, но групп нет и у всех вкладок groupId = -1.
  const yandex = params.has('yandex');
  const store = params.has('store');
  const NONE = -1;

  // Значок сайта: буква на цветном квадрате, чтобы на скриншотах не было серых заглушек.
  const fav = (letter, color) => 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="3" fill="${color}"/>` +
    `<text x="8" y="12" font-family="Arial" font-size="11" font-weight="bold" fill="#fff" text-anchor="middle">${letter}</text></svg>`);

  // [title, url, groupId, windowId, favIconUrl, pinned]
  const storeRaw = [
    ['Календарь', 'https://calendar.example.com/', NONE, 1, fav('К', '#d93025'), true],
    ['Заметки', 'https://notes.example.com/', NONE, 1, fav('З', '#f9ab00'), true],
    ['Калининград — Википедия', 'https://ru.wikipedia.org/wiki/Калининград', 8, 1, fav('W', '#5f6368')],
    ['Куршская коса — Википедия', 'https://ru.wikipedia.org/wiki/Куршская_коса', 8, 1, fav('W', '#5f6368')],
    ['Поезда Москва — Калининград: расписание', 'https://trains.example.ru/moscow-kaliningrad', 8, 1, fav('П', '#188038')],
    ['Курс «Алгоритмы» — Лекция 3. Сортировки', 'https://learn.example.org/algorithms/3', 9, 1, fav('A', '#a142f4')],
    ['GitHub - tc39/proposals: Tracking ECMAScript Proposals', 'https://github.com/tc39/proposals', 9, 1, fav('G', '#24292f')],
    ['Array.prototype.sort() - JavaScript | MDN', 'https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/Array/sort', 7, 1, fav('M', '#1b1b1b')],
    ['chrome.tabs | Chrome for Developers', 'https://developer.chrome.com/docs/extensions/reference/api/tabs', 7, 1, fav('C', '#1a73e8')],
    ['Канбан-доска — Спринт 42', 'https://board.example.com/sprint-42', 7, 1, fav('Д', '#007b83')],
    ['Pull requests · octo/tab-search', 'https://github.com/octo/tab-search/pulls', 7, 1, fav('G', '#24292f')],
    ['Fix popup scrolling · Pull Request #41 · octo/tab-search', 'https://github.com/octo/tab-search/pull/41', 7, 1, fav('G', '#24292f')],
    ['Jaeger UI', 'https://jaeger.example.com/trace/4f2a9c0b11d3', 7, 1, fav('J', '#60a5fa')],
    ['Jaeger UI', 'https://jaeger.example.com/trace/9e1d77aa02c4', 7, 1, fav('J', '#60a5fa')],
    ['Входящие — Почта', 'https://mail.example.com/inbox', 7, 1, fav('П', '#1a73e8')],
  ];

  const raw = [
    ['Jira — RSI-123 Поиск по вкладкам', 'https://jira.example.com/browse/RSI-123', 7],
    ['Merge request !42 · gitlab', 'https://gitlab.example.com/group/repo/-/merge_requests/42', 7],
    ['chrome.tabs | Chrome for Developers', 'https://developer.chrome.com/docs/extensions/reference/api/tabs', 7],
    ['Почта — Входящие', 'https://mail.example.ru/inbox', NONE],
    ['Grafana — Dashboards', 'https://grafana.example.com/dashboards', 8],
    ['Confluence: Архитектура сервиса', 'https://confluence.example.com/display/ARCH', 7],
    ['YouTube', 'https://www.youtube.com/', NONE],
    ['Новая вкладка', 'chrome://newtab/', ungrouped ? NONE : 7],
    ['Jira — RSI-200 Другое окно', 'https://jira.example.com/browse/RSI-200', NONE, 2],
    // Одинаковые заголовки, различаются только адресом.
    ['Jaeger UI', 'https://jaeger.example.com/trace/4f2a9c0b11d3', 7],
    ['Jaeger UI', 'https://jaeger.example.com/search?service=dsp-enricher&limit=20&lookback=1h&operation=all&traceID=9e1d77aa02', 7],
  ];
  let tabs = store ? storeRaw.map(([title, url, groupId, windowId, favIconUrl, pinned = false], i, all) => ({
    id: i + 1, index: i, windowId, title, url, favIconUrl, pinned, groupId, active: i === all.length - 1,
  })) : raw.map(([title, url, groupId, windowId = 1], i) => ({
    id: i + 1, index: i, windowId, title, url, active: i === 7 || i === 8,
    groupId: noGroups ? undefined : yandex ? NONE : groupId, pinned: yandex && i < 2,
    // В Яндексе группа — нестандартное поле spaceId; группа 7 → 1001, 8 и без группы → 1002.
    ...(yandex ? { spaceId: windowId === 2 ? 2001 : groupId === 7 ? 1001 : 1002 } : {}), lastAccessed: 1000 + ((i * 37) % 11),
  }));
  const groups = store
    ? { 7: { id: 7, title: 'Работа', color: 'blue' }, 8: { id: 8, title: 'Путешествие', color: 'green' }, 9: { id: 9, title: 'Учёба', color: 'purple' } }
    : { 7: { id: 7, title: 'Работа', color: 'blue' }, 8: { id: 8, title: 'Мониторинг', color: 'green' } };
  const log = (...a) => console.log('[mock chrome]', ...a);

  window.chrome = {
    tabs: {
      async query(q) {
        return tabs.filter((t) =>
          (q.active === undefined || t.active === q.active) &&
          (!q.currentWindow || t.windowId === 1) &&
          (q.groupId === undefined || t.groupId === q.groupId) &&
          (q.windowId === undefined || t.windowId === q.windowId));
      },
      async update(id, props) { log('tabs.update', id, props); },
      async get(id) { const t = tabs.find((x) => x.id === id); if (!t) throw new Error('no tab'); return t; },
      async remove(id) { log('tabs.remove', id); tabs = tabs.filter((t) => t.id !== id); },
    },
    windows: {
      async update(id, props) { log('windows.update', id, props); },
      async getAll() { return [{ id: 1, focused: true }, { id: 2, focused: false }]; },
    },
    storage: { session: {
      async get(k) { const v = sessionStorage.getItem(k); return v ? { [k]: JSON.parse(v) } : {}; },
      async set(o) { for (const [k, v] of Object.entries(o)) sessionStorage.setItem(k, JSON.stringify(v)); },
    } },
  };
  if (!noGroups) {
    window.chrome.tabGroups = {
      TAB_GROUP_ID_NONE: NONE,
      async get(id) { if (!groups[id]) throw new Error('no group'); return groups[id]; },
      async query() { return yandex ? [] : Object.values(groups); },
    };
  }
  window.close = () => log('window.close');
})();
