# Карточка для Chrome Web Store

Кабинет: https://chrome.google.com/webstore/devconsole. Расширение из Chrome Web Store ставится и в Яндекс Браузер.

## Языки (с версии 1.4.0)

Расширение одно, языков два: английский (по умолчанию) и русский. Тексты интерфейса лежат в `extension/_locales/{en,ru}/messages.json`, язык выбирает браузер пользователя; если его языка нет, показывается английский.

- Название и краткое описание берутся из переводов в пакете: **Infinite Tab Search** для английского, **Поиск по вкладкам** для русского.
- На вкладке Store listing вверху есть выпадающий список языков. В нём только те языки, что есть в `_locales` загруженного пакета, поэтому второй язык появляется после загрузки 1.4.0.
- Для каждого языка отдельно заполняются подробное описание и скриншоты. Малая плитка и иконка одни на все языки.

## Материалы

| Что | Файл |
|---|---|
| Пакет | `tab-search.zip` (`npm run zip`), версия **1.4.0** |
| Иконка магазина 128×128 | лежит в пакете: `extension/icons/icon-128.png` |
| Малая промо-плитка 440×280 (обязательна, одна на все языки) | [promo-440x280-notext.png](promo-440x280-notext.png): только иконка, без текста |
| Скриншоты 1280×800 (минимум один, до пяти), русские | [chrome/screenshots/ru/](chrome/screenshots/ru/) |
| Скриншоты 1280×800, английские | [chrome/screenshots/en/](chrome/screenshots/en/) |
| Большая промо-плитка 1400×560 | необязательна, нужна только для попадания в подборки |
| Политика конфиденциальности | https://github.com/ArturAntonov/browser-ext-tabs/blob/main/PRIVACY.md |
| Сайт / поддержка | https://github.com/ArturAntonov/browser-ext-tabs |

Перерисовать: `npm run screenshots:chrome` (нужен `npm run preview`; рисует оба языка), `npm run promo -- 440 280 notext`.

**Подписи на скриншотах** пишем про выгоду, а не про устройство выдачи: это витрина магазина, подробности остаются в описании. Тексты и на русском, и на английском лежат в [dev/store-shot-chrome.html](../dev/store-shot-chrome.html):

1. «Любая вкладка — за секунду» / Any tab in a second — поиск по всем группам и окнам.
2. «Свежие вкладки — первыми» / Recent tabs come first — режим «Активность».
3. «Похожие вкладки не спутаются» / Look-alike tabs, no mix-ups — одинаковые заголовки, виден адрес.
4. «Назад — одним нажатием» / Back in one keystroke — строка «Вернуться».
5. «Ваши вкладки — только ваши» / Your tabs stay yours — приватность: уведомление при первом запуске.

Данные на кадрах вымышленные (адреса example.com и открытые сайты), личных вкладок на них нет.

## Вкладка Store listing

- **Категория:** Productivity.
- **Название и краткое описание:** из пакета (лимит краткого описания 132 символа).
  - EN: Infinite Tab Search — «Find any tab among hundreds. Search by title, site or address across all tab groups and windows.»
  - RU: Поиск по вкладкам — «Быстрый поиск по открытым вкладкам: сначала текущая группа, при поиске — все группы и окна.»
- **Подробное описание**: вставляется отдельно для каждого языка (выбери язык в списке вверху вкладки). Chrome показывает его простым текстом.

### Подробное описание, English

```
With dozens of tabs open, finding the right one by eye takes too long. Infinite Tab Search opens a compact popup with a search field and your tabs.

How to use:
- click the toolbar button or press Ctrl+Shift+K (Cmd+Shift+K on macOS);
- with an empty query you see the tabs of your current group, newest first;
- start typing: search covers titles, sites and addresses, with matches highlighted;
- matches in the current group come first, then other groups and windows, each labelled with where the tab is;
- the Order / Activity switch sorts tabs by their position in the browser or by when you last viewed them, so the tab you just worked with comes first;
- tabs with identical titles show their full address;
- ↑/↓ to select, Enter to open, × to close a tab.

Go back: the extension remembers the tab you came from via search. The "Go back" row is first in the list, so Enter takes you back.

Tab groups: works with Chrome tab groups and Yandex Browser groups. If the browser does not expose groups, search covers the current window.

Privacy: no network requests, nothing leaves your browser. Tab titles and addresses are used only inside the popup and are not saved.
```

### Подробное описание, русский

```
Когда открыто много вкладок, найти нужную глазами долго. «Поиск по вкладкам» открывает компактное окно со списком вкладок и строкой поиска.

Как пользоваться:
- нажмите кнопку расширения на панели или Ctrl+Shift+K (Cmd+Shift+K на macOS);
- без запроса видны вкладки текущей группы, новые сверху;
- начните печатать: поиск идёт по заголовку, сайту и адресу, совпадения подсвечены;
- сначала показываются совпадения в текущей группе, затем в остальных группах и окнах — с подписью, где лежит вкладка;
- переключатель «Порядок / Активность» выбирает сортировку: как вкладки стоят в браузере или по времени последнего просмотра — так проще найти вкладку, с которой только что работали;
- у вкладок с одинаковыми заголовками виден полный адрес;
- ↑/↓ — выбрать, Enter — перейти, × — закрыть вкладку.

Вернуться назад: расширение помнит вкладку, с которой вы перешли через поиск. Строка «Вернуться» стоит первой в списке — Enter возвращает назад.

Группы вкладок: работает со стандартными группами Chrome и группами Яндекс Браузера. Если браузер группы не отдаёт, поиск идёт по текущему окну.

Конфиденциальность: расширение не делает сетевых запросов, ничего не покидает браузер. Заголовки и адреса вкладок используются только в окне расширения и не сохраняются.
```

## Вкладка Privacy practices

Эти поля не переводятся, пиши по-английски: их читают ревьюеры Google.

**Single purpose:**

> Search the user's open browser tabs by title and address and quickly switch to the tab found.

**Обоснование разрешений** (по одному полю на каждое):

- `tabs` — Reads the list of open tabs (title, URL, icon, window, position, pinned state, last-viewed time) to show and search them in the extension popup, switches to the tab the user selects, and closes a tab when the user clicks ×. Titles and URLs are not saved or sent anywhere.
- `tabGroups` — Reads tab group names and colors to show the tabs of the current group and to label which group a found tab belongs to.
- `storage` — Stores the ID of the tab the user left via search (session storage, cleared when the browser closes) for the Go back feature, a flag that the user accepted the first-run notice, and the chosen sort mode. No tab content is stored.

**Host permissions:** не используются. **Remote code:** нет, весь код в пакете, без минификации и сторонних библиотек.

**Раскрытие данных.** Правила Chrome требуют раскрывать обработку данных, даже если они остаются на устройстве, а политика обязательна. Расширение читает адреса и заголовки вкладок — это история просмотров. В форме нужно:

- отметить категорию про историю просмотров / веб-активность (точное название смотри в форме, оно может отличаться);
- подтвердить три стандартных заявления: данные не продаются, не используются не по назначению, не используются для оценки кредитоспособности;
- указать ссылку на политику конфиденциальности (она в репозитории).

Уведомление в интерфейсе: при первом запуске окно показывает, что читаются заголовки и адреса вкладок и что заголовки и адреса не сохраняются и не отправляются, а вкладки не читаются, пока пользователь не нажал «Понятно» / «Got it». Это закрывает требование о раскрытии в самом продукте.

Ответы должны совпадать с [PRIVACY.md](../PRIVACY.md) и реальным поведением: расхождение считается нарушением.

## Вкладка Distribution

- Видимость: публичное; регионы: все.
- Платных функций нет.
- Форма может спросить статус trader / non-trader (требование ЕС). Выбор зависит от тебя; я не юрист.

## Порядок обновления до 1.4.0

1. Package → Upload new package → `tab-search.zip`.
2. Store listing → язык вверху: для каждого из двух языков вставить подробное описание и заменить скриншоты (папки `ru/` и `en/`).
3. Заменить малую промо-плитку на `promo-440x280-notext.png`.
4. В Privacy practices поменять Single purpose и обоснования на английские формулировки выше.
5. Submit for review.

Срок проверки: по данным Google, обычно несколько дней, но может доходить до нескольких недель.
