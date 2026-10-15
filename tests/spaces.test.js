import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasSpace, summarizeSpaces, spaceLabel } from '../extension/spaces.js';
import { isCurrent } from '../extension/scope.js';

const tab = (id, url, spaceId, extra = {}) => ({ id, index: id, windowId: 1, url, title: '', spaceId, ...extra });

test('hasSpace: только положительный числовой spaceId', () => {
  assert.equal(hasSpace(tab(1, 'https://a.example', 577357062)), true);
  assert.equal(hasSpace(tab(1, 'https://a.example', undefined)), false);
  assert.equal(hasSpace(tab(1, 'https://a.example', 0)), false);
  assert.equal(hasSpace(tab(1, 'https://a.example', -1)), false);
});

test('summarizeSpaces: число вкладок и два самых частых сайта, закреплённые не считаются', () => {
  const s = summarizeSpaces([
    tab(1, 'https://bdocodex.com/a', 10),
    tab(2, 'https://orbit-games.com/a', 10),
    tab(3, 'https://orbit-games.com/b', 10),
    tab(4, 'https://twitch.tv/', 10),
    tab(5, 'https://jira.example.com/', 20),
    tab(6, 'https://rutube.ru/', 10, { pinned: true }),
  ]);
  assert.deepEqual(s.get(10), { count: 4, hosts: ['orbit-games.com', 'bdocodex.com'] });
  assert.deepEqual(s.get(20), { count: 1, hosts: ['jira.example.com'] });
  assert.equal(spaceLabel(s.get(10)), 'orbit-games.com, bdocodex.com · 4');
  assert.equal(spaceLabel(undefined), 'другая группа');
});

test('isCurrent по spaceId: своя группа и закреплённые этого окна', () => {
  const ctx = { spaceId: 10, windowId: 1 };
  assert.equal(isCurrent(ctx, tab(1, 'https://a.example', 10)), true);
  assert.equal(isCurrent(ctx, tab(2, 'https://a.example', 20)), false);
  assert.equal(isCurrent(ctx, tab(3, 'https://a.example', 20, { pinned: true })), true);
  assert.equal(isCurrent(ctx, tab(4, 'https://a.example', 10, { windowId: 2 })), false);
});

test('isCurrent без spaceId: откат на окно', () => {
  const ctx = { spaceId: null, group: null, windowId: 1 };
  assert.equal(isCurrent(ctx, tab(1, 'https://a.example', undefined)), true);
  assert.equal(isCurrent(ctx, tab(2, 'https://a.example', undefined, { windowId: 2 })), false);
});
