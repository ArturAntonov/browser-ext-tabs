// Подмена chrome.* для просмотра popup в обычной вкладке. ?nogroups — браузер без API групп,
// ?ungrouped — активная вкладка вне группы, ?yandex — группы браузера не видны расширению,
// ?store — правдоподобный набор вкладок для скриншотов в каталог, ?firstrun — первый запуск (уведомление), ?sort=activity — выбрана сортировка «Активность», ?lang=en — английский интерфейс.
(() => {
  const params = new URLSearchParams(location.search);
  const noGroups = params.has('nogroups');
  const ungrouped = params.has('ungrouped');
  // ?yandex — как в Яндекс Браузере: tabGroups есть, но групп нет и у всех вкладок groupId = -1.
  const yandex = params.has('yandex');
  const store = params.has('store');
  const lang = params.get('lang') || 'ru';
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

  // Для английской карточки те же вкладки, но с английскими заголовками (индекс в storeRaw → строка вместо русской).
  const STORE_EN_OVERRIDES = {
    0: ['Calendar', 'https://calendar.example.com/', NONE, 1, fav('C', '#d93025'), true],
    1: ['Notes', 'https://notes.example.com/', NONE, 1, fav('N', '#f9ab00'), true],
    2: ['Lisbon – Wikipedia', 'https://en.wikipedia.org/wiki/Lisbon', 8, 1, fav('W', '#5f6368')],
    3: ['Sintra – Wikipedia', 'https://en.wikipedia.org/wiki/Sintra', 8, 1, fav('W', '#5f6368')],
    4: ['Flights to Lisbon: timetable', 'https://flights.example.com/lisbon', 8, 1, fav('F', '#188038')],
    5: ['Algorithms course — Lecture 3. Sorting', 'https://learn.example.org/algorithms/3', 9, 1, fav('A', '#a142f4')],
    7: ['Array.prototype.sort() - JavaScript | MDN', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort', 7, 1, fav('M', '#1b1b1b')],
    9: ['Kanban board — Sprint 42', 'https://board.example.com/sprint-42', 7, 1, fav('K', '#007b83')],
    14: ['Inbox — Mail', 'https://mail.example.com/inbox', 7, 1, fav('M', '#1a73e8')],
  };
  // Сколько минут назад смотрели вкладку (по порядку storeRaw). Две «Jaeger UI»: левую только что открывали,
  // правую — давно, поэтому «Порядок» и «Активность» ставят их по-разному.
  const STORE_AGO_MIN = [9000, 8000, 4000, 3900, 3800, 3000, 2500, 180, 45, 20, 90, 5, 1, 300, 0];
  const STORE_NOW = 1792800000000;

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
  const storeData = lang === 'en' ? storeRaw.map((row, i) => STORE_EN_OVERRIDES[i] || row) : storeRaw;
  let tabs = store ? storeData.map(([title, url, groupId, windowId, favIconUrl, pinned = false], i, all) => ({
    id: i + 1, index: i, windowId, title, url, favIconUrl, pinned, groupId, active: i === all.length - 1,
    lastAccessed: STORE_NOW - STORE_AGO_MIN[i] * 60000,
  })) : raw.map(([title, url, groupId, windowId = 1], i) => ({
    id: i + 1, index: i, windowId, title, url, active: i === 7 || i === 8,
    groupId: noGroups ? undefined : yandex ? NONE : groupId, pinned: yandex && i < 2,
    // В Яндексе группа — нестандартное поле spaceId; группа 7 → 1001, 8 и без группы → 1002.
    ...(yandex ? { spaceId: windowId === 2 ? 2001 : groupId === 7 ? 1001 : 1002 } : {}), lastAccessed: 1000 + ((i * 37) % 11),
  }));
  const groups = store
    ? { 7: { id: 7, title: lang === 'en' ? 'Work' : 'Работа', color: 'blue' }, 8: { id: 8, title: lang === 'en' ? 'Travel' : 'Путешествие', color: 'green' }, 9: { id: 9, title: lang === 'en' ? 'Study' : 'Учёба', color: 'purple' } }
    : { 7: { id: 7, title: 'Работа', color: 'blue' }, 8: { id: 8, title: 'Мониторинг', color: 'green' } };
  const log = (...a) => console.log('[mock chrome]', ...a);

  window.chrome = {
    tabs: {
      async query(q) {
        window.__tabQueries = (window.__tabQueries || 0) + 1; // для проверки: до согласия вкладки не читаются
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
    storage: {
      // ?firstrun — как первый запуск: согласия ещё нет. Иначе считаем, что оно дано.
      local: {
        async get(k) {
          const v = localStorage.getItem('mock:' + k);
          if (v) return { [k]: JSON.parse(v) };
          if (k === 'sort' && params.get('sort')) return { sort: params.get('sort') };
          return k === 'consent' && !params.has('firstrun') ? { [k]: 1 } : {};
        },
        async set(o) { for (const [k, v] of Object.entries(o)) localStorage.setItem('mock:' + k, JSON.stringify(v)); },
      },
      session: {
        async get(k) { const v = sessionStorage.getItem(k); return v ? { [k]: JSON.parse(v) } : {}; },
        async set(o) { for (const [k, v] of Object.entries(o)) sessionStorage.setItem(k, JSON.stringify(v)); },
      },
    },
  };
  if (!noGroups) {
    window.chrome.tabGroups = {
      TAB_GROUP_ID_NONE: NONE,
      async get(id) { if (!groups[id]) throw new Error('no group'); return groups[id]; },
      async query() { return yandex ? [] : Object.values(groups); },
    };
  }
  // chrome.i18n как в браузере: язык из ?lang= (по умолчанию ru), недостающие тексты берутся из default_locale (en).
  const loadMessages = (l) => {
    try {
      const x = new XMLHttpRequest();
      x.open('GET', '../extension/_locales/' + l + '/messages.json', false);
      x.send();
      return x.status === 200 ? JSON.parse(x.responseText) : {};
    } catch {
      return {};
    }
  };
  const catalogs = [loadMessages(lang), loadMessages('en')];
  window.chrome.i18n = {
    getUILanguage: () => lang,
    getMessage(name, subs) {
      const entry = catalogs[0][name] || catalogs[1][name];
      if (!entry) return '';
      const args = subs == null ? [] : [].concat(subs);
      let text = entry.message;
      for (const [ph, def] of Object.entries(entry.placeholders || {})) {
        const n = Number(String(def.content).replace('$', ''));
        text = text.replace(new RegExp('\\$' + ph + '\\$', 'gi'), args[n - 1] ?? '');
      }
      return text.replace(/\$\$/g, '$');
    },
  };
  document.documentElement.lang = lang;
  window.close = () => log('window.close');
})();
