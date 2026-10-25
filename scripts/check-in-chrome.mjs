// Проверка в настоящем Chrome: загружает папку расширения как распакованное (через DevTools-канал, ключ
// --load-extension в новых Chrome отключён), открывает окно поиска и печатает, что видит расширение:
// название и версию из манифеста с учётом перевода, язык, текст окна и ошибки консоли.
// Язык интерфейса — системный (на macOS Chrome другого выбрать не даёт).
// Запуск: npm run check:chrome   (путь к Chrome можно задать переменной CHROME)
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const extDir = resolve(process.argv[2] ?? 'extension');
const chromePath = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'ext-check-'));
const chrome = spawn(chromePath, [
  '--headless', '--no-first-run', `--user-data-dir=${profile}`,
  '--remote-debugging-pipe', '--enable-unsafe-extension-debugging', 'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
const [toChrome, fromChrome] = [chrome.stdio[3], chrome.stdio[4]];

const pending = new Map();
const errors = [];
let seq = 0;
let buf = '';
fromChrome.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\0')) >= 0) {
    const m = JSON.parse(buf.slice(0, i));
    buf = buf.slice(i + 1);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map((a) => a.value ?? a.description).join(' '));
  }
});
const send = (method, params = {}, sessionId) => new Promise((resolveMsg) => {
  const id = ++seq;
  pending.set(id, resolveMsg);
  toChrome.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const finish = async (code) => {
  chrome.kill();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
  process.exit(code);
};
setTimeout(() => { console.log('ТАЙМАУТ: Chrome не ответил за 40 с'); chrome.kill(); process.exit(2); }, 40000).unref();

const loaded = await send('Extensions.loadUnpacked', { path: extDir });
if (loaded.error) {
  console.log('Chrome не принял расширение:', JSON.stringify(loaded.error));
  await finish(1);
}
const id = loaded.result.id;
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Runtime.enable', {}, sessionId);
await send('Page.enable', {}, sessionId);
await send('Page.navigate', { url: `chrome-extension://${id}/popup.html` }, sessionId);
await sleep(2500);
const info = await send('Runtime.evaluate', {
  returnByValue: true,
  expression: `JSON.stringify({
    name: chrome.runtime.getManifest().name, version: chrome.runtime.getManifest().version,
    description: chrome.runtime.getManifest().description, uiLanguage: chrome.i18n.getUILanguage(),
    title: document.title, text: document.body.innerText.slice(0, 200) })`,
}, sessionId);
console.log('расширение загружено, id =', id);
console.log(JSON.stringify(JSON.parse(info.result.result.value), null, 2));
console.log('ошибки в консоли:', errors.length ? errors : 'нет');
await finish(errors.length ? 1 : 0);
