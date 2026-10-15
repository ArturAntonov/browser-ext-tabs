// Работа с chrome.*: текущая группа, все вкладки, переходы и возврат назад.
import { hasSpace } from './spaces.js';

export function groupsApiAvailable() {
  return typeof chrome !== 'undefined' && typeof chrome.tabGroups?.query === 'function';
}

const NO_GROUP = () => chrome.tabGroups?.TAB_GROUP_ID_NONE ?? -1;

export function inGroup(tab) {
  return typeof tab.groupId === 'number' && tab.groupId !== NO_GROUP();
}

// Контекст: активная вкладка, её окно и группа (если браузер даёт API групп).
export async function resolveContext() {
  const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
  const groupsApi = groupsApiAvailable();
  const groups = groupsApi ? await chrome.tabGroups.query({}).catch(() => []) : [];
  const groupsById = new Map(groups.map((g) => [g.id, g]));
  const group = active && inGroup(active) ? groupsById.get(active.groupId) ?? null : null;
  // Группа Яндекса (spaceId) важнее chrome.tabGroups: стандартные группы Яндекс не заполняет.
  const spaceId = hasSpace(active) ? active.spaceId : null;
  return { windowId: active?.windowId, activeTabId: active?.id, spaceId, group, groupsById, groupsApi };
}

// Вкладка в «текущей» области: в группе активной вкладки, а без группы — в её окне.
export function isCurrent(ctx, tab) {
  if (ctx.spaceId != null) {
    // Закреплённые вкладки видны в любой группе окна — считаем их текущими.
    return tab.windowId === ctx.windowId && (tab.pinned || tab.spaceId === ctx.spaceId);
  }
  if (ctx.group) return tab.groupId === ctx.group.id;
  return tab.windowId === ctx.windowId;
}

export function loadAllTabs() {
  return chrome.tabs.query({});
}

async function activateTab(tab) {
  await chrome.tabs.update(tab.id, { active: true });
  await chrome.windows.update(tab.windowId, { focused: true });
}

// Возврат назад: id вкладки, с которой ушли последним переходом через расширение.
const RETURN_KEY = 'returnTo';
const store = () => chrome.storage?.session ?? chrome.storage?.local;

export async function getReturnTab(activeTabId) {
  const s = store();
  if (!s) return null;
  const { [RETURN_KEY]: id } = await s.get(RETURN_KEY);
  if (id == null || id === activeTabId) return null;
  return chrome.tabs.get(id).catch(() => null);
}

// Переход с запоминанием, откуда ушли. Повторный «назад» возвращает обратно, как Alt+Tab.
export async function jumpTo(tab, fromTabId) {
  if (fromTabId != null && fromTabId !== tab.id) await store()?.set({ [RETURN_KEY]: fromTabId });
  await activateTab(tab);
}

export function closeTab(tab) {
  return chrome.tabs.remove(tab.id);
}

// Снимок того, что браузер отдаёт расширению, — чтобы понять, как устроены группы Яндекса.
export async function diagnostics() {
  const [windows, tabs] = await Promise.all([chrome.windows.getAll(), chrome.tabs.query({})]);
  const groups = groupsApiAvailable() ? await chrome.tabGroups.query({}).catch((e) => String(e)) : null;
  const host = (url) => {
    try { return new URL(url).hostname; } catch { return ''; }
  };
  // Яндекс может добавлять к вкладкам и окнам свои поля — собираем все ключи, а не только известные.
  const STANDARD_TAB_KEYS = new Set(['active', 'audible', 'autoDiscardable', 'discarded', 'favIconUrl', 'frozen',
    'groupId', 'height', 'highlighted', 'id', 'incognito', 'index', 'lastAccessed', 'mutedInfo', 'openerTabId',
    'pendingUrl', 'pinned', 'selected', 'sessionId', 'splitViewId', 'status', 'title', 'url', 'width', 'windowId']);
  const tabKeys = {};
  for (const t of tabs) for (const k of Object.keys(t)) tabKeys[k] = (tabKeys[k] || 0) + 1;
  const extraTabKeys = Object.keys(tabKeys).filter((k) => !STANDARD_TAB_KEYS.has(k));
  const namespaces = Object.keys(chrome).sort();
  const methods = (ns) => (chrome[ns] ? Object.keys(chrome[ns]).sort() : null);
  return {
    userAgent: navigator.userAgent,
    namespaces,
    tabsApi: methods('tabs'),
    windowsApi: methods('windows'),
    tabGroupsApiMethods: methods('tabGroups'),
    tabKeys,
    extraTabKeys,
    windowKeys: [...new Set(windows.flatMap((w) => Object.keys(w)))].sort(),
    spaces: Object.entries(tabs.reduce((acc, t) => {
      const k = `${t.windowId}/${t.spaceId}`;
      acc[k] = acc[k] || { tabs: 0, pinned: 0, active: 0 };
      acc[k].tabs += 1;
      acc[k].pinned += t.pinned ? 1 : 0;
      acc[k].active += t.active ? 1 : 0;
      return acc;
    }, {})).map(([k, v]) => ({ windowSpace: k, ...v })),
    tabGroupsApi: groupsApiAvailable(),
    groupIdNone: chrome.tabGroups?.TAB_GROUP_ID_NONE,
    windows: windows.map((w) => ({ id: w.id, focused: w.focused, type: w.type, state: w.state })),
    groups,
    tabs: tabs.map((t) => ({
      id: t.id, windowId: t.windowId, index: t.index, groupId: t.groupId, active: t.active,
      pinned: t.pinned, discarded: t.discarded, frozen: t.frozen, status: t.status,
      lastAccessed: t.lastAccessed, host: host(t.url || t.pendingUrl || ''), title: (t.title || '').slice(0, 30),
      ...Object.fromEntries(extraTabKeys.filter((k) => k in t).map((k) => [k, t[k]])),
    })),
  };
}
