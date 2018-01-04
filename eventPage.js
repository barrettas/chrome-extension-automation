function resetStates() {
  Object.keys(localStorage).forEach(key => {
    if (key === 'undefined' || key === undefined || key === 'firstRun') {
      return;
    }
    const storedEntry = JSON.parse(localStorage.getItem(key));
    storedEntry.bActivated = false;
    localStorage.setItem(key, JSON.stringify(storedEntry));
  });
}

function checkForValidUrl(tab) {
  if (!tab.active) return;
  Object.keys(localStorage).forEach(key => {
    if (key === 'undefined' || key === undefined || key === 'firstRun') {
      return;
    }
    const storedEntry = JSON.parse(localStorage.getItem(key));
    if (storedEntry.bActivated === false) {
      storedEntry.filterWords.forEach(filterPtrn => {
        const patt = new RegExp(filterPtrn, 'i');
        if (patt.test(tab.url)) {
          // console.log(tab.url,storedEntry.name)
          storedEntry.bActivated = true;
          localStorage.setItem(key, JSON.stringify(storedEntry));
        }
      });
    }
  });
}

function setExt() {
  // go through and disable/enable extensions marked for activation
  chrome.browserAction.setBadgeBackgroundColor({
    color: [0, 0, 0, 0],
  });
  chrome.browserAction.setBadgeText({
    text: '',
  });
  Object.keys(localStorage).forEach(key => {
    if (key === 'undefined' || key === undefined || key === 'firstRun') {
      return;
    }
    chrome.management.get(key, ext => {
      if (!ext) return; // Extension may have been removed?
      const storedEntry = JSON.parse(localStorage.getItem(ext.id));
      if (storedEntry.bEnable === true) {
        if (storedEntry.bActivated === true) {
          chrome.management.setEnabled(storedEntry.id, true);
          chrome.browserAction.setBadgeBackgroundColor({
            color: [100, 250, 100, 120],
          });
          chrome.browserAction.setBadgeText({
            text: 'ON',
          });
        } else {
          chrome.management.setEnabled(storedEntry.id, false);
        }
      } else if (storedEntry.bActivated === true) {
        chrome.management.setEnabled(storedEntry.id, false);
        chrome.browserAction.setBadgeBackgroundColor({
          color: [250, 100, 100, 120],
        });
        chrome.browserAction.setBadgeText({
          text: 'ON',
        });
      } else {
        chrome.management.setEnabled(storedEntry.id, true);
      }
      localStorage.setItem(ext.id, JSON.stringify(storedEntry));
      // console.log("Enabled?", ext.enabled, " Set to Enable?", storedEntry.bEnable, "Set to Activate (enable/disable)?", storedEntry.bActivated);
    });
  });
}

function doTabChange(tabId, changeInfo, tab) {
  if (changeInfo.status === 'loading') {
    // Execute script when the page is fully (DOM) ready, otherwise EVENT FIRES TWICE!
    resetStates();
    checkForValidUrl(tab);
    setExt();
  }
}

chrome.tabs.onUpdated.addListener(doTabChange);
chrome.tabs.onActivated.addListener(ctx => {
  chrome.tabs.get(ctx.tabId, tab => {
    doTabChange(ctx.tabId, { status: 'loading' }, tab);
  });
});
chrome.tabs.onRemoved.addListener((/* tabId, removeInfo */) => {
  resetStates();
  setExt();
});
// on init get all
chrome.browserAction.setBadgeText({
  text: '',
});

resetStates();
chrome.tabs.getCurrent(tab => {
  if (tab) checkForValidUrl(tab);
});
setExt();
