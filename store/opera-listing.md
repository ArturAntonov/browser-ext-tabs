# Карточка для Opera Add-ons

Поля формы на addons.opera.com/developer. Название и категория задаются при загрузке пакета; описание, иконка и скриншоты — на вкладке **Versions** у конкретной версии; промо-картинка — на вкладке **Promotional Image**. Заполнить на двух языках: русский — основной, английский — для ревьюеров и остальных пользователей.

## Общее

| Поле | Значение |
|---|---|
| Пакет | `tab-search.zip` — собирается `npm run zip` из папки `extension/` |
| Категория | Productivity |
| Иконка каталога | [store/icon-64.png](icon-64.png) (64×64), запасная [store/icon-128.png](icon-128.png) |
| Промо-картинка | [store/promo-300x188.png](promo-300x188.png) — вкладка Promotional Image, размер 300×188 подтверждён в кабинете Opera. Перерисовать: `npm run promo` |
| Скриншоты | [1-current-group.png](screenshots/1-current-group.png), [2-search-all-groups.png](screenshots/2-search-all-groups.png), [3-in-browser.png](screenshots/3-in-browser.png) — все 612×408 |
| Лицензия | MIT — [LICENSE](../LICENSE) |
| Политика конфиденциальности | https://github.com/ArturAntonov/browser-ext-tabs/blob/main/PRIVACY.md |
| Страница поддержки | https://github.com/ArturAntonov/browser-ext-tabs (вопросы и ошибки — https://github.com/ArturAntonov/browser-ext-tabs/issues) |

## Русский

**Название:** Поиск по вкладкам

**Краткое описание (summary, одно предложение):**
Находит нужную вкладку среди десятков открытых по заголовку, сайту или адресу и показывает, в какой группе она лежит.

**Описание:**

Когда открыто много вкладок, найти нужную глазами долго. «Поиск по вкладкам» открывает компактное окно со списком вкладок и строкой поиска.

Как пользоваться:
- нажмите кнопку расширения на панели или Ctrl+Shift+K (на macOS — Cmd+Shift+K);
- без запроса видны вкладки текущей группы: недавно открытые сверху, закреплённые внизу;
- у вкладок с одинаковыми заголовками виден полный адрес — их легко различить;
- начните печатать — поиск идёт по заголовку, сайту и адресу, совпадения подсвечиваются;
- сначала показываются совпадения в текущей группе, затем в других группах и окнах — с подписью, где лежит вкладка;
- переключатель «Порядок / Активность» выбирает сортировку: как вкладки стоят в браузере или по времени последнего просмотра — так проще найти вкладку, с которой только что работали;
- ↑/↓ — выбрать, Enter — перейти, «×» — закрыть вкладку.

Вернуться назад: расширение помнит вкладку, с которой вы перешли. Строка «Вернуться» стоит первой в списке, а Ctrl+Shift+L (Cmd+Shift+L) переключает между двумя вкладками туда и обратно.

Группы вкладок: поддерживаются стандартные группы Chromium и группы Яндекс Браузера. Если браузер группы не отдаёт, поиск работает по текущему окну.

Конфиденциальность: расширение не делает сетевых запросов и ничего не отправляет. Данные вкладок используются только в окне расширения.

Горячие клавиши можно поменять на странице сочетаний клавиш для расширений.

## English

**Name:** Tab Search

**Summary (one sentence):**
Finds the tab you need among dozens of open ones by title, site or URL and shows which tab group it belongs to.

**Description:**

With many tabs open, finding the right one by eye takes too long. Tab Search opens a compact popup with your tabs and a search field.

How to use:
- click the toolbar button or press Ctrl+Shift+K (Cmd+Shift+K on macOS);
- with an empty query you see the tabs of the current group: recent ones on top, pinned ones at the bottom;
- tabs with identical titles show their full address, so they are easy to tell apart;
- start typing to search by title, site and URL, with matches highlighted;
- matches in the current group come first, then other groups and windows, each labelled with where the tab is;
- the "Порядок / Активность" (Order / Activity) switch sorts tabs by their position in the browser or by when you last viewed them, so the tab you just worked with is easy to find;
- ↑/↓ to select, Enter to switch, "×" to close a tab.

Go back: the extension remembers the tab you came from. The "Go back" row is first in the list, and Ctrl+Shift+L (Cmd+Shift+L) toggles between the two tabs.

Tab groups: standard Chromium tab groups and Yandex Browser groups are supported. If the browser does not expose groups, search covers the current window.

Privacy: no network requests, nothing is sent anywhere. Tab data is used only inside the popup.

Note: the interface is currently in Russian.

## Что нового (changelog для версий)

### 1.3.0 (в Opera пока 1.1.0, эти изменения войдут в следующее обновление)

RU:
- Переключатель сортировки «Порядок / Активность» для списка и результатов поиска. «Активность» ставит выше вкладки, которые недавно просматривали, — удобно, когда много вкладок с одинаковым заголовком. Выбор запоминается.
- При первом запуске показывается уведомление о том, какие данные читает расширение (все данные остаются в браузере). Пока оно не принято, вкладки не читаются.
- Убрана отдельная горячая клавиша возврата: строка «Вернуться» в окне поиска делает то же самое.

EN:
- A sort switch "Order / Activity" for the list and search results. "Activity" puts recently viewed tabs first, which helps when many tabs share a title. The choice is remembered.
- A notice on first launch explains what data the extension reads (everything stays in the browser). Tabs are not read until it is accepted.
- The separate "go back" keyboard shortcut is removed: the "Go back" row in the popup does the same.

### 1.1.0

RU:
- Вкладка, на которой открыт поиск, отмечена синей полосой и плашкой «текущая» — её видно, даже если выбрать другую строку.
- У вкладок с одинаковыми заголовками под заголовком виден полный адрес страницы, длинный адрес сокращается в середине. Полный адрес показывается и когда запрос нашёлся только в адресе.
- Заголовки вкладок крупнее, адрес — спокойнее: список легче читать.

EN:
- The tab you opened the search from is marked with a blue bar and a "текущая" (current) badge, visible even when another row is selected.
- Tabs with identical titles show their full address, shortened in the middle if long. The full address is also shown when the query matched only in the URL.
- Larger tab titles and a quieter address line make the list easier to scan.

### 1.0.0

Первая версия.

## Обоснование разрешений (если спросят на ревью)

- `tabs` — заголовки и адреса вкладок для поиска, переключение на найденную вкладку, закрытие по «×».
- `tabGroups` — названия и цвета групп вкладок для подписей.
- `storage` — помнить вкладку для «Вернуться» (сессионное хранилище).

## Третий скриншот: расширение в браузере

Готов: [3-in-browser.png](screenshots/3-in-browser.png) — снят в Opera, обрезан до панели и окна расширения (без строки меню macOS и боковой панели), уменьшен `sips`. Как переснять:

Opera просит хотя бы один снимок, где видно, где расширение находится в интерфейсе браузера. Его нужно снять вручную:

1. Установить Opera начисто или открыть новый профиль, другие расширения выключить.
2. Загрузить `extension/` как распакованное расширение (`opera://extensions` → режим разработчика), закрепить кнопку на панели.
3. Открыть несколько обычных вкладок, нажать кнопку расширения, чтобы окно было открыто под ней.
4. Снять окно браузера и уменьшить до 612×408 (максимум 800×600), сохранить как `store/screenshots/3-in-browser.png`.
