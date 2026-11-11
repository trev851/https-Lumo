/* Lumo UI enhancements. Uses existing local app data and browser APIs only. */
(() => {
  'use strict';
  const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value == null ? fallback : JSON.parse(value); } catch { return fallback; } };
  const write = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const app = () => document.querySelector('#app');
  let quickRun = false;

  function createButton(label, className = 'ghost') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    return button;
  }

  // Fast play uses the app's existing source ordering (preferred addon first).
  function addQuickPlayButtons() {
    const root = app();
    if (!root) return;
    root.querySelectorAll('a.card[href*="#/item/"]').forEach(link => {
      const card = link.closest('.card') || link;
      if (card.querySelector('.lumo-quick-play')) return;
      const match = link.getAttribute('href').match(/#\/item\/([^/]+)\/(.+)$/);
      if (!match) return;
      const button = createButton('▶ Play');
      button.className = 'lumo-quick-play';
      button.style.cssText = 'position:absolute;right:6px;top:6px;padding:7px 9px;border-radius:999px;z-index:2;font-size:12px';
      button.dataset.itemType = match[1];
      button.dataset.itemId = decodeURIComponent(match[2]);
      card.style.position = 'relative';
      card.append(button);
    });
  }

  function applyFavoriteSubtitle() {
    const select = document.querySelector('#sub');
    if (!select || !select.options.length) return;
    const favorite = String(read('lumo-favorite-subtitle', '') || '').trim().toLowerCase();
    if (!favorite) return;
    const option = [...select.options].find(item => item.value && (`${item.textContent} ${item.value}`).toLowerCase().includes(favorite));
    if (option && select.value !== option.value) {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function addSubtitlePreference() {
    const select = document.querySelector('#sub');
    if (!select || document.querySelector('#lumo-subtitle-preference')) return;
    const label = document.createElement('label');
    label.id = 'lumo-subtitle-preference';
    label.className = 'muted';
    label.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin:6px 0';
    label.innerHTML = 'Favorite subtitle <input type="text" maxlength="12" placeholder="e.g. eng" style="width:100px;padding:7px">';
    const input = label.querySelector('input');
    input.value = read('lumo-favorite-subtitle', '') || '';
    input.addEventListener('change', () => { write('lumo-favorite-subtitle', input.value.trim()); applyFavoriteSubtitle(); });
    select.insertAdjacentElement('afterend', label);
    applyFavoriteSubtitle();
  }

  function autoPlayPending() {
    if (quickRun || !location.hash.startsWith('#/item/')) return;
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem('lumo-quick-play') || 'null'); } catch { pending = null; }
    if (!pending) return;
    const route = location.hash.match(/^#\/item\/([^/]+)\/(.+)$/);
    if (!route || route[1] !== pending.type || decodeURIComponent(route[2]) !== pending.id) return;
    const sourceList = document.querySelector('#st');
    if (!sourceList) return;
    const playButton = [...sourceList.querySelectorAll('button[data-i]')].find(button => {
      const source = button.closest('.src');
      return source && !/torrent:\s*not playable/i.test(source.textContent) && button.offsetParent !== null;
    });
    if (playButton) {
      quickRun = true;
      sessionStorage.removeItem('lumo-quick-play');
      addSubtitlePreference();
      applyFavoriteSubtitle();
      playButton.click();
      setTimeout(() => { quickRun = false; }, 1200);
    } else if (/no sources found/i.test(sourceList.textContent || '')) {
      sessionStorage.removeItem('lumo-quick-play');
    }
  }

  function libraryTools() {
    const root = app();
    if (!root || !/My Library/.test(root.textContent || '') || root.querySelector('#lumo-library-tools')) return;
    const grid = root.querySelector('.grid');
    if (!grid) return;
    const toolbar = document.createElement('div');
    toolbar.id = 'lumo-library-tools';
    toolbar.className = 'ad';
    toolbar.style.display = 'block';
    toolbar.innerHTML = '<div class="eps"><select id="lumo-library-sort"><option value="name">Sort: Name</option><option value="date">Sort: Date added</option><option value="genre">Sort: Genre</option></select><select id="lumo-library-filter"><option value="all">All titles</option><option value="movie">Movies</option><option value="series">Series</option></select><input id="lumo-library-search" type="search" placeholder="Search Library and collections"></div>';
    grid.parentNode.insertBefore(toolbar, grid);
    const sort = toolbar.querySelector('#lumo-library-sort');
    const filter = toolbar.querySelector('#lumo-library-filter');
    const search = toolbar.querySelector('#lumo-library-search');
    sort.value = read('lumo-library-sort', 'name');
    filter.value = read('lumo-library-filter', 'all');
    search.value = read('lumo-library-search', '');
    const originals = [...grid.querySelectorAll('.card')].map((card, index) => ({ card, index, name: card.textContent.trim(), type: (card.querySelector('a[href]')?.getAttribute('href') || '').match(/#\/item\/([^/]+)/)?.[1] || '', genre: card.dataset.genre || '', date: Number(card.dataset.added || 0) }));
    const redraw = () => {
      const q = search.value.trim().toLowerCase(), type = filter.value, order = sort.value;
      write('lumo-library-sort', order); write('lumo-library-filter', type); write('lumo-library-search', q);
      let rows = originals.filter(row => (type === 'all' || row.type === type) && row.name.toLowerCase().includes(q));
      rows.sort((a, b) => order === 'date' ? (b.date - a.date || a.index - b.index) : order === 'genre' ? (a.genre || a.name).localeCompare(b.genre || b.name) : a.name.localeCompare(b.name));
      grid.replaceChildren(...rows.map(row => row.card));
      const result = root.querySelector('#lumo-library-result-count');
      if (result) result.textContent = `${rows.length} title${rows.length === 1 ? '' : 's'}`;
    };
    const count = document.createElement('small'); count.id = 'lumo-library-result-count'; count.className = 'muted'; toolbar.append(count);
    [sort, filter, search].forEach(control => { control.addEventListener('input', redraw); control.addEventListener('change', redraw); });
    redraw();
  }

  function addonTools() {
    const root = app();
    if (!root || !root.querySelector('#af') || root.querySelector('#lumo-addon-controls')) return;
    const urls = read('urls', []);
    if (!Array.isArray(urls) || !urls.length) return;
    const block = document.createElement('section');
    block.id = 'lumo-addon-controls';
    block.innerHTML = '<h2>Addon order and switches</h2><p class="muted">Switches disable addon requests without removing the saved manifest URL. Reordering affects the next source search.</p>';
    const disabled = read('lumo-disabled-addons', []);
    urls.forEach((url, index) => {
      const row = document.createElement('div'); row.className = 'ad';
      const label = document.createElement('div');
      const loaded = [...root.querySelectorAll('.ad')].find(item => item.textContent.includes(url.replace(/\?.*/, '').slice(0, 28)));
      label.innerHTML = `<b>${esc(loaded?.querySelector('b')?.textContent || `Addon ${index + 1}`)}</b><small>${esc(url.replace(/(\/)[^/]{18,}(?=\/)/g, '$1••••'))}</small>`;
      const enabled = createButton(disabled.includes(url) ? 'Off' : 'On'); enabled.className = 'ghost'; enabled.setAttribute('aria-pressed', String(!disabled.includes(url)));
      enabled.addEventListener('click', () => {
        const next = new Set(read('lumo-disabled-addons', []));
        if (next.has(url)) next.delete(url); else next.add(url);
        write('lumo-disabled-addons', [...next]);
        enabled.textContent = next.has(url) ? 'Off' : 'On'; enabled.setAttribute('aria-pressed', String(!next.has(url)));
      });
      const up = createButton('↑'); up.className = 'ghost'; up.disabled = index === 0;
      const down = createButton('↓'); down.className = 'ghost'; down.disabled = index === urls.length - 1;
      const move = delta => { const list = [...read('urls', [])], target = index + delta; if (target < 0 || target >= list.length) return; [list[index], list[target]] = [list[target], list[index]]; write('urls', list); location.reload(); };
      up.addEventListener('click', () => move(-1)); down.addEventListener('click', () => move(1));
      const controls = document.createElement('div'); controls.className = 'eps'; controls.append(enabled, up, down);
      row.append(label, controls); block.append(row);
    });
    root.querySelector('#af').insertAdjacentElement('afterend', block);
  }

  // Guard addon requests using the saved enabled/disabled switch state.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = function(input, init) {
    try {
      const requestUrl = typeof input === 'string' ? input : input.url;
      const parsed = new URL(requestUrl, location.href);
      const target = parsed.searchParams.get('u');
      const candidate = target ? new URL(target) : parsed;
      const disabled = read('lumo-disabled-addons', []);
      const addons = read('urls', []);
      if (Array.isArray(disabled) && Array.isArray(addons) && addons.some(url => {
        try { return disabled.includes(url) && new URL(url).host === candidate.host; } catch { return false; }
      })) return Promise.reject(new TypeError('This addon is turned off in Lumo settings.'));
    } catch {}
    return nativeFetch(input, init);
  };

  function playerPip() {
    const video = document.querySelector('#pl');
    if (!video || video.dataset.lumoPipButton) return;
    video.dataset.lumoPipButton = 'true';
    const button = createButton('⧉ Picture-in-picture');
    button.className = 'ghost';
    button.style.margin = '8px 0';
    button.addEventListener('click', async () => {
      try {
        if (!document.pictureInPictureEnabled || !video.requestPictureInPicture) { alert('Picture-in-picture is not supported by this browser.'); return; }
        if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
        else await video.requestPictureInPicture();
      } catch { alert('Picture-in-picture could not start. Start playback first and try again.'); }
    });
    video.insertAdjacentElement('afterend', button);
  }

  function localDateTime(day, time) {
    const now = new Date(); let date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (/tomorrow/i.test(day)) date.setDate(date.getDate() + 1);
    else {
      const parsedDay = new Date(day);
      if (!Number.isNaN(parsedDay.getTime())) date = new Date(parsedDay.getFullYear(), parsedDay.getMonth(), parsedDay.getDate());
      else return null;
    }
    const match = time.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (!match) return null;
    let hour = Number(match[1]), minute = Number(match[2] || 0);
    if (match[3]) { if (match[3].toLowerCase() === 'pm' && hour < 12) hour += 12; if (match[3].toLowerCase() === 'am' && hour === 12) hour = 0; }
    date.setHours(hour, minute, 0, 0); return date;
  }
  function icsEscape(value) { return String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
  function icsDate(date) { return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z'); }
  function scheduleCalendar() {
    const root = app();
    if (!root || !/Weekly schedule/i.test(root.textContent || '')) return;
    root.querySelectorAll('.ad').forEach(row => {
      if (row.querySelector('[data-lumo-ics]')) return;
      const titleLink = row.querySelector('a[href*="#/item/series/"]');
      if (!titleLink) return;
      const parentHeading = row.previousElementSibling;
      const heading = parentHeading?.tagName === 'H2' ? parentHeading.textContent.trim() : '';
      const text = row.textContent.replace(/\s+/g, ' ').trim();
      const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i) || text.match(/\b(\d{1,2}:\d{2})\b/);
      const date = timeMatch ? localDateTime(heading, timeMatch[1]) : null;
      if (!date) return;
      const button = createButton('＋ Calendar reminder'); button.className = 'ghost'; button.dataset.lumoIcs = '1';
      button.addEventListener('click', () => {
        const start = new Date(date), end = new Date(start.getTime() + 60 * 60000);
        const title = text;
        const content = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Lumo//Episode reminder//EN','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${crypto.randomUUID ? crypto.randomUUID() : Date.now() + '@lumo'}`,'DTSTAMP:' + icsDate(new Date()),'DTSTART:' + icsDate(start),'DTEND:' + icsDate(end),'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:Episode reminder','END:VALARM','SUMMARY:' + icsEscape(title),'END:VEVENT','END:VCALENDAR'].join('\r\n');
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' }); const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a'); anchor.href = objectUrl; anchor.download = 'lumo-episode-reminder.ics'; anchor.click(); setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      });
      row.append(button);
    });
  }

  function shareTitle() {
    const root = app();
    if (!root || !location.hash.startsWith('#/item/') || root.querySelector('#lumo-share-title')) return;
    const button = createButton('Share title'); button.id = 'lumo-share-title'; button.className = 'ghost';
    button.addEventListener('click', async () => {
      const url = location.href, title = root.querySelector('.hero h1')?.textContent || document.title;
      try { if (navigator.share) await navigator.share({ title, url }); else { await navigator.clipboard.writeText(url); button.textContent = 'Link copied'; } }
      catch {}
    });
    const hero = root.querySelector('.hero'); if (hero) hero.append(button);
  }

  function run() {
    addQuickPlayButtons(); addSubtitlePreference(); autoPlayPending(); libraryTools(); addonTools(); playerPip(); scheduleCalendar(); shareTitle();
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('.lumo-quick-play');
    if (!button) return;
    event.preventDefault(); event.stopPropagation();
    const { itemType, itemId } = button.dataset;
    if (!itemType || !itemId) return;
    sessionStorage.setItem('lumo-quick-play', JSON.stringify({ type: itemType, id: itemId }));
    location.hash = `#/item/${itemType}/${encodeURIComponent(itemId)}`;
  }, true);

  const root = app();
  if (root) new MutationObserver(run).observe(root, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => { quickRun = false; });
  run();
})();
