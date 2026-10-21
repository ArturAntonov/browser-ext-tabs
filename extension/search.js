// Чистая логика поиска: без chrome.*, чтобы тестировать в node.

const WORD_BOUNDARY = /[\s\-_./:|·—–()[\]«»"',]/;

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// Адрес для подписи под заголовком: без схемы и www, с путём и параметрами.
// Вкладки одного сайта обычно различаются концом адреса (id задачи, трейса, товара),
// поэтому длинный адрес сокращается в середине пути, а домен и хвост остаются.
export function displayUrl(url, max = 80) {
  let u;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return url;
  const host = u.hostname.replace(/^www\./, '') + (u.port ? `:${u.port}` : '');
  let rest = u.pathname + u.search + u.hash;
  try {
    rest = decodeURI(rest); // кириллица и пробелы в пути — читаемо
  } catch {
    // битая кодировка — оставляем как есть
  }
  if (rest === '/') rest = '';
  const full = host + rest;
  if (full.length <= max) return full;
  const keep = max - host.length - 1; // 1 — на «…»
  if (keep < 12) return full.slice(0, max - 1) + '…';
  const head = Math.ceil(keep * 0.35);
  return host + rest.slice(0, head) + '…' + rest.slice(rest.length - (keep - head));
}

// Полный адрес под заголовком нужен не всегда — только там, где без него не обойтись:
// — у вкладок с одинаковыми заголовками в текущем списке (их не различить иначе);
// — когда часть запроса нашлась только в адресе (видно, почему вкладка в результатах).
// Остальным хватает домена — так список спокойнее.
const normTitle = (t) => t.trim().toLowerCase();

export function duplicateTitles(rows) {
  const counts = new Map();
  for (const r of rows) {
    const k = normTitle(r.title);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n > 1).map(([k]) => k));
}

export function needsFullUrl(row, query, dupTitles) {
  if (dupTitles.has(normTitle(row.title))) return true;
  const title = row.title.toLowerCase();
  const host = row.host.toLowerCase();
  return tokenize(query).some((t) => !title.includes(t) && !host.includes(t));
}

export function tokenize(query) {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

// Совпадение в начале строки ценнее, чем в начале слова, а то — ценнее, чем в середине.
function scoreField(text, token, weight) {
  const i = text.indexOf(token);
  if (i === -1) return 0;
  if (i === 0) return weight * 3;
  return weight * (WORD_BOUNDARY.test(text[i - 1]) ? 2 : 1);
}

export const SORT_ORDER = 'order';
export const SORT_ACTIVITY = 'activity';

// Порядок полосы вкладок справа налево: новые вкладки открываются справа, поэтому они сверху,
// а закреплённые (всегда слева) — в конце.
function byPosition(a, b) {
  return (a.tab.windowId ?? 0) - (b.tab.windowId ?? 0) || b.tab.index - a.tab.index;
}

// Активность: недавно просмотренные сверху. lastAccessed — когда вкладку в последний раз делали активной.
// После восстановления сессии у нетронутых вкладок оно почти одинаковое, тогда решает положение в полосе.
function byActivity(a, b) {
  return (b.tab.lastAccessed ?? 0) - (a.tab.lastAccessed ?? 0) || byPosition(a, b);
}

// Каждый токен запроса должен найтись в заголовке, домене или URL (логическое И).
// sort = 'order' — по релевантности, при равной — по положению в полосе; 'activity' — только по недавности.
export function searchTabs(tabs, query, sort = SORT_ORDER) {
  const tokens = tokenize(query);
  const byTime = sort === SORT_ACTIVITY ? byActivity : byPosition;
  const items = tabs.map((tab) => {
    const url = tab.url || tab.pendingUrl || '';
    return { tab, title: tab.title || url, host: hostnameOf(url), url, score: 0 };
  });
  if (tokens.length === 0) return items.sort(byTime);

  const results = [];
  for (const item of items) {
    const title = item.title.toLowerCase();
    const host = item.host.toLowerCase();
    const url = item.url.toLowerCase();
    let total = 0;
    for (const token of tokens) {
      const s = Math.max(scoreField(title, token, 3), scoreField(host, token, 2), scoreField(url, token, 1));
      if (s === 0) {
        total = 0;
        break;
      }
      total += s;
    }
    if (total > 0) results.push({ ...item, score: total });
  }
  return sort === SORT_ACTIVITY ? results.sort(byActivity) : results.sort((a, b) => b.score - a.score || byPosition(a, b));
}

// Без запроса — только текущая область. С запросом — сначала совпадения в текущей области,
// потом во всех остальных; у каждой записи флаг current.
export function arrangeResults(tabs, query, isCurrent, sort = SORT_ORDER) {
  const mark = (item) => ({ ...item, current: isCurrent(item.tab) });
  if (tokenize(query).length === 0) {
    return searchTabs(tabs.filter(isCurrent), '', sort).map(mark);
  }
  const found = searchTabs(tabs, query, sort).map(mark);
  return [...found.filter((r) => r.current), ...found.filter((r) => !r.current)];
}

// Диапазоны [start, end) для подсветки совпадений, отсортированные и слитые.
export function matchRanges(text, query) {
  const lower = text.toLowerCase();
  const ranges = [];
  for (const token of tokenize(query)) {
    let from = 0;
    let i;
    while ((i = lower.indexOf(token, from)) !== -1) {
      ranges.push([i, i + token.length]);
      from = i + token.length;
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return merged;
}
