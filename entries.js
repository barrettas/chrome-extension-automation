// Copyright © Russell Hoy 2012 All Right Reserved.
// No parts of this document may be used in any published or commercial
// materials without prior consent. I would happy to share this code, but I prefer being asked first.

function getStored() {
  $('#export').val(JSON.stringify(localStorage));
}

function firstRun() {
  // make sure old users don't have corrupt data from old localStorage.
  const isFirstRun = localStorage.firstRun === 'true';
  if (!isFirstRun) {
    localStorage.clear();
    localStorage.firstRun = 'true';
  }
}

function isExtensionType(ext) {
  return ext.type === 'extension';
}

function loadExtensions(extensions) {
  const extdd = document.getElementById('dropdown_ext_list');
  extensions
    .filter(ext => isExtensionType(ext) && ext.name !== 'Extension Automation')
    .map(({ name, id }) => new Option(name, id))
    .sort((optA, optB) => (optA.label > optB.label ? 1 : -1))
    .forEach(opt => extdd.options.add(opt));
}

function addStore(extId, filterText, bEnable) {
  chrome.management.get(extId, ext => {
    if (!isExtensionType(ext)) {
      return;
    }
    const storedEntry = JSON.parse(localStorage.getItem(ext.id));
    const filterWords = [
      ...((storedEntry || {}).filterWords || []),
      filterText,
    ];
    let enable = true;
    if (bEnable === 'Enable') {
      enable = true;
    } else {
      enable = false;
    }
    const entry = {
      id: ext.id,
      name: ext.name,
      bEnable: enable,
      bActivated: false,
      filterWords,
    };
    localStorage.setItem(ext.id, JSON.stringify(entry));
  });
}

function setStored() {
  const string = $('#import').val();
  try {
    const data = JSON.parse(string);
    Object.entries(data).forEach(([key, val]) => {
      localStorage[key] = val;
    });
    firstRun();
    makeTable();

    $('#flash').fadeIn('medium', () => {
      $('#flash').fadeOut(2000);
    });
  } catch (err) {
    alert(
      `Sorry, there was a problem importing data. Most likely, the imported data has a formatting mistake. Details: ${err}`,
    );
  }
}

function selectAll(id) {
  document.getElementById(id).focus();
  document.getElementById(id).select();
}

function setupEvents() {
  document
    .querySelector('#export')
    .addEventListener('focus', () => selectAll('export'));
  document
    .querySelector('#importBut')
    .addEventListener('click', () => setStored());
  document.querySelector('#clearBut').addEventListener('click', () => {
    const prompt = confirm('Erase all saved settings?');
    if (prompt === true) {
      localStorage.clear();
      firstRun();
      makeTable();
    }
  });
  document
    .querySelector('#manageExtsLink')
    .addEventListener('click', () =>
      chrome.tabs.create({ url: 'chrome://settings/extensions' }),
    );
}

function makeTable() {
  const table = document.getElementById('prefs-table');
  table.innerHTML = '';
  if (localStorage.length > 1) {
    table.innerHTML = '<tr><th>Extension</th> <th>Filter</th></tr>';
  }
  const $tbody = document.createElement('tbody');
  Object.keys(localStorage).forEach(extId => {
    if (extId === 'undefined' || extId === 'firstRun') {
      return;
    }
    try {
      chrome.management.get(extId, ext => {
        if (typeof ext === 'undefined'){
          console.log('Continuing past unfound extension ' + JSON.parse(localStorage.getItem(extId)).name + '(' + extId + ')');
          return;
        }
        const entry = JSON.parse(localStorage.getItem(ext.id));
        if (entry == null) {
          return;
        }
        const $tr = document.createElement('tr');
        $tr.setAttribute('id', entry.bEnable);
        let $td = document.createElement('td');
        const extensionName = document.createElement('a');
        document.createTextNode(entry.name);

        // add icons if possible
        try {
          if (ext.icons[1]) {
            extensionName.innerHTML = `<img src=${
              ext.icons[1].url
            } width = 30 height = 30 />  `;
          } else if (ext.icons[0]) {
            extensionName.innerHTML = `<img src=${
              ext.icons[0].url
            } width = 30 height = 30 />  `;
          } else if (ext.icons[2]) {
            extensionName.innerHTML = `<img src=${
              ext.icons[2].url
            } width = 30 height = 30 />  `;
          } else {
            extensionName.innerHTML =
              "<img src='blank.png'; width = 30; height = 30 />  ";
          }
        } catch (err) {
          extensionName.innerHTML =
            "<img src='blank.png'; width = 30; height = 30 />  ";
        }
        // add disable sign
        extensionName.innerHTML += "<img src= 'nosign1.png'; class = 'nosign'/>";
        extensionName.innerHTML += ext.name;
        $td.appendChild(extensionName);
        $td.setAttribute('class', entry.id);
        $td.addEventListener(
          'click',
          ({ currentTarget: { className: entryId } }) => {
            const storedEntry = JSON.parse(window.localStorage.getItem(entryId));
            if (storedEntry.bEnable === false) {
              // if disabled, enable
              storedEntry.bEnable = true;
              window.localStorage.setItem(entryId, JSON.stringify(storedEntry));
            } else {
              storedEntry.bEnable = false;
              window.localStorage.setItem(entryId, JSON.stringify(storedEntry));
            }
            makeTable();
          },
        );
        $tr.appendChild($td);
        $td = document.createElement('td');

        entry.filterWords.forEach((filterWord, idx) => {
          const enableWords = document.createElement('span');
          enableWords.innerHTML = `${filterWord},<br>`;
          enableWords.setAttribute('class', entry.id);
          enableWords.setAttribute('id', idx);
          enableWords.addEventListener(
            'click',
            ({ target: { className: entryId, id: itemIdx } }) => {
              const storedEntry = JSON.parse(localStorage.getItem(entryId));
              console.log('Removing filter ' + storedEntry.filterWords.splice(itemIdx, 1) + ' for extension ' + storedEntry.name);
              if (storedEntry.filterWords.length === 0) {
                // if no filter words left, delete entry
                localStorage.removeItem(entryId);
              } else {
                localStorage.setItem(entryId, JSON.stringify(storedEntry));
              }
              makeTable();
            },
          );
          $td.appendChild(enableWords);
        });
        $tr.appendChild($td);
        $tbody.appendChild($tr);
        table.appendChild($tbody);
      });
    } catch(e) {
      console.error('Problem finding extension:', e);
    }
  });
  getStored();
  setupEvents();
}

function init() {
  getStored(); // fill export box
  firstRun();
  // bind accordians
  // $(".toggle").slideUp(); //start up
  $('.trigger').click(function() {
    $(this)
      .next('.toggle')
      .slideToggle('medium');
  });

  const form = document.getElementById('prefs-form');

  chrome.management.getAll(loadExtensions);
  form.addEventListener('submit', (/* event */) => {
    const selectedExt = document.getElementById('dropdown_ext_list').value;
    const filterWords = document.getElementById('txtEnter').value;
    const bEnable = document.getElementById('bEnable').value;
    addStore(selectedExt, filterWords, bEnable);
  });
  makeTable();
}

function popupInit(popupForm) {
  chrome.tabs.getSelected(tab => {
    const getUrl = tab.url;
    const domainUrl = getUrl.split('/');
    const setUrl = document.getElementById('currentUrl');
    setUrl.outerHTML = `<input type = text id = "currentUrl" value =${
      domainUrl[2]
    }/>`;
  });

  chrome.management.getAll(loadExtensions);
  popupForm.addEventListener('submit', (/* event */) => {
    const selectedExt = document.getElementById('dropdown_ext_list').value;
    const filterWords = document.getElementById('currentUrl').value;
    const bEnable = document.getElementById('bEnable').value;
    addStore(selectedExt, filterWords, bEnable);
    window.close();
  });
}

(function() {
  const optsLink = document.querySelector('#goto1');
  if (optsLink) {
    optsLink.onclick = function openOptions() {
      window.open('options.html');
    };
  }
  const popupForm = document.querySelector('#popup-form');
  if (popupForm) popupInit(popupForm);
  if (popupForm == null) init();
})();
