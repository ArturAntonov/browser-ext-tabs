import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSort, setSort } from '../extension/prefs.js';

const fakeArea = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    async get(key) { return key in data ? { [key]: data[key] } : {}; },
    async set(obj) { Object.assign(data, obj); },
  };
};

test('по умолчанию — порядок', async () => {
  assert.equal(await getSort(fakeArea()), 'order');
});

test('выбор активности запоминается', async () => {
  const area = fakeArea();
  await setSort(area, 'activity');
  assert.equal(await getSort(area), 'activity');
  await setSort(area, 'order');
  assert.equal(await getSort(area), 'order');
});

test('неизвестное значение превращается в порядок, и читая, и записывая', async () => {
  assert.equal(await getSort(fakeArea({ sort: 'что-то' })), 'order');
  const area = fakeArea();
  await setSort(area, 'что-то');
  assert.equal(area.data.sort, 'order');
});

test('сломанное или отсутствующее хранилище: порядок, без исключений', async () => {
  const broken = { async get() { throw new Error('нет доступа'); }, async set() { throw new Error('нет доступа'); } };
  assert.equal(await getSort(broken), 'order');
  await setSort(broken, 'activity');
  assert.equal(await getSort(undefined), 'order');
  await setSort(undefined, 'activity');
});
