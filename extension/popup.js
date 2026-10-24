import {
  arrangeResults, matchRanges, hostnameOf, displayUrl, duplicateTitles, needsFullUrl, SORT_ORDER, SORT_ACTIVITY,
} from './search.js';
import { hasSpace, summarizeSpaces, spaceLabel, spaceColor } from './spaces.js';
import { hasConsent, giveConsent } from './consent.js';
import { getSort, setSort } from './prefs.js';
import {
  resolveContext, isCurrent, inGroup, loadAllTabs, jumpTo, getReturnTab, closeTab, diagnostics,
} from './scope.js';

const GROUP_COLORS = {
  grey: '#5f6368', blue: '#1a73e8', red: '#d93025', yellow: '#f9ab00', green: '#188038',
  pink: '#d01884', purple: '#a142f4', cyan: '#007b83', orange: '#fa903e',
};

const state = {
  ctx: null,
  tabs: [],
  returnTab: null,
  rows: [], // { kind: 'return' | 'tab', tab, ... }
  selected: 0,
  query: '',
  sort: SORT_ORDER,
};

const el = (tag, cls, text) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
};

const app = document.getElementById('app');
const header = el('div', 'header');
const input = el('input', 'query');
input.type = 'search';
input.placeholder = 'Заголовок, сайт или адрес…';
input.autocomplete = 'off';
input.spellcheck = false;
const scopeLine = el('div', 'scope');

// Переключатель сортировки: одно значение на весь интерфейс, действует и на открытый список, и на результаты поиска.
const sortBox = el('div', 'sort');
sortBox.setAttribute('role', 'group');
sortBox.setAttribute('aria-label', 'Сортировка');
const SORT_OPTIONS = [
  [SORT_ORDER, 'Порядок', 'Как вкладки стоят в браузере: справа налево, новые сверху'],
  [SORT_ACTIVITY, 'Активность', 'Сначала те, что недавно просматривали'],
];
const sortButtons = SORT_OPTIONS.map(([mode, label, hint]) => {
  const btn = el('button', 'seg', label);
  btn.title = hint;
  btn.addEventListener('click', () => setSortMode(mode));
  sortBox.append(btn);
  return [mode, btn];
});
header.append(input, scopeLine);
const list = el('ul', 'list');
list.setAttribute('role', 'listbox');
const footer = el('div', 'footer');
const footerText = el('span');
const diagBtn = el('button', 'link', 'Диагностика');
diagBtn.title = 'Скопировать в буфер, что браузер отдаёт расширению о вкладках и группах';
footer.append(footerText, diagBtn);
app.append(header, list, footer);

function highlight(text, query) {
  const frag = document.createDocumentFragment();
  let pos = 0;
  for (const [start, end] of matchRanges(text, query)) {
    if (start > pos) frag.append(text.slice(pos, start));
    frag.append(el('mark', null, text.slice(start, end)));
    pos = end;
  }
  frag.append(text.slice(pos));
  return frag;
}

function favicon(tab) {
  const src = tab.favIconUrl || '';
  if (/^(https?|data):/.test(src)) {
    const img = el('img', 'icon');
    img.src = src;
    img.alt = '';
    img.addEventListener('error', () => img.replaceWith(el('span', 'icon icon-empty')));
    return img;
  }
  return el('span', 'icon icon-empty');
}

function tabsWord(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'вкладка';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'вкладки';
  return 'вкладок';
}

const groupName = (g) => `«${g.title || 'без названия'}»`;

// Подпись «где лежит вкладка» для вкладок вне текущей области.
function locationBadge(tab) {
  const { ctx } = state;
  if (tab.windowId === ctx.windowId && hasSpace(tab) && tab.spaceId !== ctx.spaceId && !tab.pinned) {
    const node = el('span', 'badge dot', `группа: ${spaceLabel(ctx.spaces.get(tab.spaceId))}`);
    node.style.setProperty('--dot', spaceColor(tab.spaceId));
    node.title = 'Яндекс не отдаёт расширениям названия групп — показаны главные сайты группы и число вкладок';
    return node;
  }
  const group = inGroup(tab) ? ctx.groupsById.get(tab.groupId) : null;
  let text;
  if (group) text = `группа ${groupName(group)}`;
  else if (tab.windowId !== ctx.windowId) text = 'другое окно';
  else if (ctx.groupsById.size > 0) text = 'вне группы';
  else return null; // групп браузер не отдаёт — «вне группы» было бы неправдой
  const node = el('span', 'badge', text);
  if (group) {
    node.classList.add('dot');
    node.style.setProperty('--dot', GROUP_COLORS[group.color] || GROUP_COLORS.grey);
  }
  return node;
}

function renderScope() {
  const { ctx } = state;
  scopeLine.replaceChildren();
  if (ctx.spaceId != null) {
    const summary = ctx.spaces.get(ctx.spaceId);
    const chip = el('span', 'chip dot', `Текущая группа · ${summary?.count ?? 0} ${tabsWord(summary?.count ?? 0)}`);
    chip.style.setProperty('--dot', spaceColor(ctx.spaceId));
    scopeLine.append(chip);
    const others = [...ctx.spaces.keys()].filter((id) => id !== ctx.spaceId).length;
    if (others) scopeLine.append(el('span', 'hint', `ещё групп: ${others}`));
  } else if (ctx.group) {
    const chip = el('span', 'chip dot', `Группа ${groupName(ctx.group)}`);
    chip.style.setProperty('--dot', GROUP_COLORS[ctx.group.color] || GROUP_COLORS.grey);
    scopeLine.append(chip);
  } else {
    scopeLine.append(el('span', 'chip', 'Текущее окно'));
    let reason = 'API групп недоступно';
    if (ctx.groupsApi) reason = ctx.groupsById.size === 0 ? 'группы браузера расширению не видны' : 'вкладка вне группы';
    scopeLine.append(el('span', 'hint', reason));
  }
  scopeLine.append(sortBox);
}

function renderSort() {
  for (const [mode, btn] of sortButtons) btn.setAttribute('aria-pressed', String(state.sort === mode));
}

function tabRow(row, i) {
  const li = el('li', 'item');
  li.setAttribute('role', 'option');
  li.setAttribute('aria-selected', i === state.selected);
  const { tab } = row;
  // Вкладка, на которой открыли поиск, — отдельный постоянный стиль, не зависящий от выбора мышью.
  if (tab.id === state.ctx.activeTabId) li.classList.add('active-tab');
  if (tab.pinned) li.classList.add('pinned');
  const text = el('div', 'text');
  const title = el('div', 'title');
  const titleText = el('span', 'title-text');
  titleText.append(highlight(row.title, state.query));
  title.append(titleText);
  if (tab.id === state.ctx.activeTabId && row.kind === 'tab') title.append(el('span', 'now-pill', 'текущая'));
  const sub = el('div', 'host');
  // В режиме «всё окно» (Chrome, активная вкладка вне группы) вкладки групп тоже подписываем.
  const windowScope = !state.ctx.group && state.ctx.spaceId == null;
  const showBadge = row.kind === 'return' || !row.current || (windowScope && inGroup(tab));
  const badge = showBadge ? locationBadge(tab) : null;
  if (badge) sub.append(badge);
  // Полный адрес — только где он помогает (одинаковые заголовки, совпадение лишь в адресе), иначе домен.
  // 64 символа помещаются в строку целиком — длинный адрес сокращаем сами, в середине, а не CSS-ом в конце.
  const full = row.kind === 'tab' && needsFullUrl(row, state.query, state.dupTitles);
  const address = full ? displayUrl(row.url, badge ? 48 : 64) : row.host || row.url;
  sub.append(highlight(address, state.query));
  text.append(title, sub);
  li.append(favicon(tab), text);
  if (row.kind === 'return') {
    li.classList.add('return');
    li.prepend(el('span', 'return-icon', '↩'));
  } else {
    const close = el('button', 'close', '×');
    close.title = 'Закрыть вкладку';
    close.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRow(i);
    });
    li.append(close);
  }
  li.addEventListener('click', () => open(i));
  li.addEventListener('mousemove', () => {
    if (state.selected !== i) select(i);
  });
  return li;
}

function renderList() {
  list.replaceChildren();
  const searching = state.query.trim() !== '';
  let lastSection = null;
  state.rows.forEach((row, i) => {
    const section = row.kind === 'return' ? 'return' : row.current ? 'current' : 'other';
    if (searching && section !== lastSection) {
      const label = section === 'current'
        ? (state.ctx.group || state.ctx.spaceId != null ? 'В текущей группе' : 'В текущем окне')
        : 'В других группах и окнах';
      list.append(el('li', 'section', label));
    }
    lastSection = section;
    list.append(tabRow(row, i));
  });
  const count = state.rows.filter((r) => r.kind === 'tab').length;
  if (count === 0) {
    list.append(el('li', 'empty', searching ? 'Ничего не найдено' : 'Нет вкладок'));
  }
  // Подсказка, что поиск шире текущей группы, — пока строка поиска пуста (раньше жила справа в шапке).
  footerText.textContent = `${count} · ↑↓ выбрать · Enter перейти${searching ? '' : ' · поиск — по всем группам и окнам'}`;
}

function select(i) {
  const items = list.querySelectorAll('.item');
  items[state.selected]?.setAttribute('aria-selected', 'false');
  state.selected = i;
  const node = items[i];
  node?.setAttribute('aria-selected', 'true');
  node?.scrollIntoView({ block: 'nearest' });
}

function update() {
  const { ctx } = state;
  const results = arrangeResults(state.tabs, state.query, (tab) => isCurrent(ctx, tab), state.sort)
    .map((r) => ({ ...r, kind: 'tab' }));
  const rows = [];
  if (state.returnTab && state.query.trim() === '') {
    const t = state.returnTab;
    rows.push({ kind: 'return', tab: t, title: `Вернуться: ${t.title || t.url}`, host: hostnameOf(t.url || ''), url: t.url || '' });
  }
  state.rows = rows.concat(results);
  state.dupTitles = duplicateTitles(results);
  state.selected = 0;
  renderList();
}

// При открытии без запроса показать, где ты сейчас: выделить активную вкладку
// (если сверху нет строки «Вернуться») и прокрутить к ней.
function focusActiveTab() {
  const i = state.rows.findIndex((r) => r.kind === 'tab' && r.tab.id === state.ctx.activeTabId);
  if (i === -1) return;
  const node = list.querySelectorAll('.item')[i];
  if (state.rows[0]?.kind === 'return') node?.scrollIntoView({ block: 'center' });
  else {
    select(i);
    node?.scrollIntoView({ block: 'center' });
  }
}

async function setSortMode(mode) {
  if (state.sort !== mode) {
    state.sort = mode;
    renderSort();
    update();
    if (!state.query.trim()) focusActiveTab();
    setSort(chrome.storage?.local, mode); // запоминаем в фоне, ждать не нужно
  }
  input.focus();
}

async function open(i) {
  const row = state.rows[i];
  if (!row) return;
  await jumpTo(row.tab, state.ctx.activeTabId);
  window.close();
}

async function removeRow(i) {
  const row = state.rows[i];
  if (!row || row.kind !== 'tab') return;
  await closeTab(row.tab);
  state.tabs = state.tabs.filter((t) => t.id !== row.tab.id);
  update();
  select(Math.min(i, state.rows.length - 1));
}

input.addEventListener('input', () => {
  state.query = input.value;
  update();
});

input.addEventListener('keydown', (e) => {
  const n = state.rows.length;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (n) select((state.selected + 1) % n);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (n) select((state.selected - 1 + n) % n);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    open(state.selected);
  }
});

diagBtn.addEventListener('click', async () => {
  const json = JSON.stringify(await diagnostics(), null, 1);
  try {
    await navigator.clipboard.writeText(json);
    diagBtn.textContent = 'Скопировано';
  } catch {
    diagBtn.textContent = 'Не удалось скопировать';
    console.log(json);
  }
});

const PRIVACY_URL = 'https://github.com/ArturAntonov/browser-ext-tabs/blob/main/PRIVACY.md';

// Первый запуск: объясняем, что читается и куда это идёт, и ждём явного «Понятно».
// Вкладки при этом не читаются: init() не доходит до resolveContext() и loadAllTabs().
function showConsent() {
  const box = el('div', 'consent');
  const link = el('a', null, 'Политика конфиденциальности');
  link.href = PRIVACY_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  const ok = el('button', 'primary', 'Понятно');
  ok.addEventListener('click', async () => {
    await giveConsent(chrome.storage.local);
    app.replaceChildren(header, list, footer);
    start();
  });
  box.append(
    el('h2', null, 'Поиск по вкладкам'),
    el('p', null, 'Расширение читает заголовки и адреса ваших открытых вкладок, чтобы показать их списком и искать по ним.'),
    el('p', null, 'Всё происходит только внутри браузера: заголовки и адреса не сохраняются и никуда не отправляются.'),
    el('p', 'consent-link', ''),
    ok,
  );
  box.querySelector('.consent-link').append(link);
  app.replaceChildren(box);
  ok.focus();
}

async function start() {
  state.ctx = await resolveContext();
  [state.tabs, state.returnTab] = await Promise.all([loadAllTabs(), getReturnTab(state.ctx.activeTabId)]);
  state.sort = await getSort(chrome.storage?.local);
  state.ctx.spaces = summarizeSpaces(state.tabs.filter((t) => t.windowId === state.ctx.windowId));
  renderScope();
  renderSort();
  update();
  focusActiveTab();
  input.focus();
}

async function init() {
  if (await hasConsent(chrome.storage?.local)) start();
  else showConsent();
}

init();
