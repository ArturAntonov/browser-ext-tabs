import { getReturnTab, jumpTo } from './scope.js';

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'jump-back') return;
  const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const tab = await getReturnTab(active?.id);
  if (tab) await jumpTo(tab, active?.id);
});
