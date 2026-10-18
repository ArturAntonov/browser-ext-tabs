import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasConsent, giveConsent, CONSENT_KEY, CONSENT_VERSION } from '../extension/consent.js';

const fakeArea = (initial = {}) => {
  const data = { ...initial };
  return {
    data,
    async get(key) { return key in data ? { [key]: data[key] } : {}; },
    async set(obj) { Object.assign(data, obj); },
  };
};

test('согласия нет, пока пользователь не нажал «Понятно»', async () => {
  assert.equal(await hasConsent(fakeArea()), false);
});

test('после согласия оно сохраняется и распознаётся', async () => {
  const area = fakeArea();
  await giveConsent(area);
  assert.equal(area.data[CONSENT_KEY], CONSENT_VERSION);
  assert.equal(await hasConsent(area), true);
});

test('согласие на старую версию уведомления не считается', async () => {
  assert.equal(await hasConsent(fakeArea({ [CONSENT_KEY]: CONSENT_VERSION - 1 })), false);
});

test('сломанное хранилище: согласия нет, исключение не вылетает', async () => {
  const broken = { async get() { throw new Error('нет доступа'); }, async set() { throw new Error('нет доступа'); } };
  assert.equal(await hasConsent(broken), false);
  await giveConsent(broken);
});

test('хранилища нет вовсе: согласия нет', async () => {
  assert.equal(await hasConsent(undefined), false);
});
