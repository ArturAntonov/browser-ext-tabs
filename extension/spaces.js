// Группы Яндекс Браузера («spaces»). Яндекс не отдаёт их через chrome.tabGroups, но добавляет
// к каждой вкладке нестандартное поле spaceId. Названий групп в API нет, поэтому подписываем
// группу по содержимому: число вкладок и самые частые сайты.
import { hostnameOf } from './search.js';

export function hasSpace(tab) {
  return typeof tab?.spaceId === 'number' && tab.spaceId > 0;
}

// spaceId -> { count, hosts } по незакреплённым вкладкам (закреплённые видны во всех группах окна).
export function summarizeSpaces(tabs) {
  const byId = new Map();
  for (const tab of tabs) {
    if (!hasSpace(tab) || tab.pinned) continue;
    let s = byId.get(tab.spaceId);
    if (!s) byId.set(tab.spaceId, (s = { count: 0, hostCounts: new Map() }));
    s.count += 1;
    const host = hostnameOf(tab.url || tab.pendingUrl || '');
    if (host) s.hostCounts.set(host, (s.hostCounts.get(host) || 0) + 1);
  }
  const out = new Map();
  for (const [id, s] of byId) {
    const hosts = [...s.hostCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([h]) => h);
    out.set(id, { count: s.count, hosts: hosts.slice(0, 2) });
  }
  return out;
}

export function spaceLabel(summary) {
  if (!summary) return 'другая группа';
  const hosts = summary.hosts.length ? summary.hosts.join(', ') : 'без сайтов';
  return `${hosts} · ${summary.count}`;
}

const PALETTE = ['#1a73e8', '#188038', '#d93025', '#f9ab00', '#a142f4', '#007b83', '#fa903e', '#d01884', '#5f6368'];

// Стабильный цвет группы в пределах сессии, чтобы глазом отличать группы в результатах.
export function spaceColor(spaceId) {
  return PALETTE[Math.abs(spaceId) % PALETTE.length];
}
