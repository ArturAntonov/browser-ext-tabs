# Политика конфиденциальности — «Поиск по вкладкам»

Дата вступления в силу: 15 октября 2026 г. Обновлено: 21 октября 2026 г. (версия 1.3.0).

## Коротко

Расширение не собирает, не хранит на серверах и не передаёт никому ваши данные. Всё работает только внутри вашего браузера.

## Какие данные используются и зачем

Чтобы показать список и искать по нему, расширение читает у открытых вкладок:

- заголовок страницы, адрес (URL) и значок сайта;
- окно, позицию вкладки, признак закрепления и время последнего просмотра;
- принадлежность к группе вкладок: стандартные группы браузера (`chrome.tabGroups`), а в Яндекс Браузере — номер группы (`spaceId`).

Эти данные используются только в окне расширения, пока оно открыто, и никуда не отправляются.

## Что хранится

Номер вкладки, с которой вы последний раз перешли через поиск, — для функции «Вернуться». Он хранится в сессионном хранилище браузера (`chrome.storage.session`) и удаляется при закрытии браузера.

Начиная с версии 1.2.0 при первом запуске показывается уведомление, а после нажатия «Понятно» сохраняется одна отметка об этом (`chrome.storage.local`). Данных о ваших вкладках в ней нет. Пока вы не нажали «Понятно», расширение не читает вкладки.

Начиная с версии 1.3.0 так же запоминается выбранный способ сортировки списка — «Порядок» или «Активность» (`chrome.storage.local`). Данных о вкладках в нём нет.

## Сетевые запросы

Расширение не делает сетевых запросов, не использует аналитику, рекламу и сторонние сервисы, не загружает внешний код.

## Кнопка «Диагностика»

По нажатию копирует в буфер обмена технический отчёт: какие поля браузер отдаёт расширению, домены и первые 30 символов заголовков вкладок. Отчёт никуда не отправляется — что с ним делать, решаете вы.

## Разрешения

- `tabs` — читать заголовки, адреса и время последнего просмотра вкладок, переключаться на найденную вкладку и закрывать её по кнопке «×».
- `tabGroups` — читать названия и цвета групп вкладок.
- `storage` — помнить вкладку для «Вернуться», отметку, что вы прочитали уведомление при первом запуске, и выбранную сортировку.

## Контакты

Вопросы по конфиденциальности: artur_septem@vk.com

---

# Privacy Policy — Tab Search

Effective date: October 15, 2026. Updated: October 21, 2026 (version 1.3.0).

The extension does not collect, store on any server, or share your data. Everything happens inside your browser.

**Data used.** To list and search tabs, the extension reads each open tab's title, URL, favicon, window, position, pinned state, last-viewed time and tab group (standard browser tab groups via `chrome.tabGroups`; in Yandex Browser, its group number `spaceId`). This data is used only in the extension popup while it is open and is never sent anywhere.

**Data stored.** The ID of the tab you last left via search, for the "Go back" feature. It is kept in the browser's session storage (`chrome.storage.session`) and cleared when the browser closes. Since version 1.2.0 a notice is shown on first launch; after you click "Понятно" ("Got it"), a single flag is saved (`chrome.storage.local`). It contains no tab data. Until you click it, the extension does not read your tabs. Since version 1.3.0 your chosen list sort mode (by tab order or by recent activity) is also saved in `chrome.storage.local`; it contains no tab data.

**Network.** The extension makes no network requests, uses no analytics, ads or third-party services, and loads no remote code.

**Diagnostics button.** When clicked, copies a technical report to the clipboard (available tab fields, domains and the first 30 characters of tab titles). It is not sent anywhere.

**Permissions.** `tabs` — read tab titles, URLs and last-viewed times, switch to a tab, close a tab with the "×" button. `tabGroups` — read tab group names and colors. `storage` — remember the tab for "Go back" the flag that you read the first-launch notice, and your sort choice.

**Contact:** artur_septem@vk.com
