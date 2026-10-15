// Чистая логика поиска: без chrome.*, чтобы тестировать в node.

const WORD_BOUNDARY = /[\s\-_./:|·—–()[\]«»"',]/;

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
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

// Порядок полосы вкладок справа налево: новые вкладки открываются справа, поэтому они сверху,
// а закреплённые (всегда слева) — в конце. Время последнего открытия не годится:
// после восстановления сессии у сотен вкладок оно почти одинаковое.
function byPosition(a, b) {
  return (a.tab.windowId ?? 0) - (b.tab.windowId ?? 0) || b.tab.index - a.tab.index;
}

// Каждый токен запроса должен найтись в заголовке, домене или URL (логическое И).
export function searchTabs(tabs, query) {
  const tokens = tokenize(query);
  const items = tabs.map((tab) => {
    const url = tab.url || tab.pendingUrl || '';
    return { tab, title: tab.title || url, host: hostnameOf(url), url, score: 0 };
  });
  if (tokens.length === 0) return items.sort(byPosition);

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
  return results.sort((a, b) => b.score - a.score || byPosition(a, b));
}

// Без запроса — только текущая область. С запросом — сначала совпадения в текущей области,
// потом во всех остальных; у каждой записи флаг current.
export function arrangeResults(tabs, query, isCurrent) {
  const mark = (item) => ({ ...item, current: isCurrent(item.tab) });
  if (tokenize(query).length === 0) {
    return searchTabs(tabs.filter(isCurrent), '').map(mark);
  }
  const found = searchTabs(tabs, query).map(mark);
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
