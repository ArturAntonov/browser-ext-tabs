// Подмена chrome.* для просмотра popup в обычной вкладке. ?nogroups — браузер без API групп,
// ?ungrouped — активная вкладка вне группы, ?yandex — группы браузера не видны расширению.
(() => {
  const params = new URLSearchParams(location.search);
  const noGroups = params.has('nogroups');
  const ungrouped = params.has('ungrouped');
  // ?yandex — как в Яндекс Браузере: tabGroups есть, но групп нет и у всех вкладок groupId = -1.
  const yandex = params.has('yandex');
  const NONE = -1;

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
  ];
  let tabs = raw.map(([title, url, groupId, windowId = 1], i) => ({
    id: i + 1, index: i, windowId, title, url, active: i === 7 || i === 8,
    groupId: noGroups ? undefined : yandex ? NONE : groupId, pinned: yandex && i < 2,
    // В Яндексе группа — нестандартное поле spaceId; группа 7 → 1001, 8 и без группы → 1002.
    ...(yandex ? { spaceId: windowId === 2 ? 2001 : groupId === 7 ? 1001 : 1002 } : {}), lastAccessed: 1000 + ((i * 37) % 11),
  }));
  const groups = { 7: { id: 7, title: 'Работа', color: 'blue' }, 8: { id: 8, title: 'Мониторинг', color: 'green' } };
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
