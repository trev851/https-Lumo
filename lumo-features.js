(() => {
  'use strict';
  if (window.__lumoFeatureEnhancer) return;
  window.__lumoFeatureEnhancer = true;

  const read = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const root = () => document.querySelector('#app');

  function button(label, extraClass = 'ghost') {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = extraClass;
    el.textContent = label;
    return el;
  }

  function attachQuickPlayButtons() {
    const appEl = root();
    if (!appEl) return;
    appEl.querySelectorAll('a.card[href*="#/item/"]').forEach(link => {
      const card = link.closest('.card') || link;
      if (card.querySelector('.lumo-quick-play')) return;
      const match = link.getAttribute('href').match(/#\/item\/([^/]+)\/(.+)$/);
      if (!match) return;
      const btn = button('▶ Play', 'lumo-quick-play');
      btn.style.cssText = 'position:absolute;right:6px;top:6px;padding:7px 9px;border-radius:999px;z-index:2;font-size:12px';
      btn.dataset.type = match[1];
      btn.dataset.id = decodeURIComponent(match[2]);
      card.style.position = 'relative';
      card.appendChild(btn);
    });
  }

  function applyFavoriteSubtitle() {
    const sub = document.querySelector('#sub');
    if (!sub || !sub.options || !sub.options.length) return;
    const favorite = String(read('lumo-favorite-subtitle', '') || '').trim().toLowerCase();
    if (!favorite) return;
    const option = Array.from(sub.options).find(item => {
      const text = `${item.textContent || ''} ${item.value || ''}`.toLowerCase();
      return text.includes(favorite);
    });
    if (option && sub.value !== option.value) {
      sub.value = option.value;
      sub.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function ensureFavoriteSubtitleInput() {
    const sub = document.querySelector('#sub');
    if (!sub || document.querySelector('#lumo-subtitle-pref')) return;
    const label = document.createElement('label');
    label.id = 'lumo-subtitle-pref';
    label.className = 'muted';
    label.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin:6px 0';
    label.innerHTML = 'Favorite subtitle <input type="text" maxlength="12" placeholder="eng" style="width:100px;padding:7px">';
    const input = label.querySelector('input');
    input.value = read('lumo-favorite-subtitle', '');
    input.addEventListener('change', () => {
      const value = input.value.trim();
      write('lumo-favorite-subtitle', value);
      applyFavoriteSubtitle();
    });
    sub.parentNode.insertBefore(label, sub.nextSibling);
    applyFavoriteSubtitle();
  }

  function handleQuickPlayClick() {
    document.addEventListener('click', event => {
      const btn = event.target.closest('.lumo-quick-play');
      if (!btn) return;
      event.preventDefault();
      event.stopPropagation();
      const { type, id } = btn.dataset;
      if (!type || !id) return;
      sessionStorage.setItem('lumo-quick-play', JSON.stringify({ type, id }));
      location.hash = '#/item/' + type + '/' + encodeURIComponent(id);
    }, true);
  }

  function handlePendingQuickPlay() {
    const pending = (() => {
      try {
        return JSON.parse(sessionStorage.getItem('lumo-quick-play') || 'null');
      } catch {
        return null;
      }
    })();
    if (!pending) return;
    const sub = document.querySelector('#sub');
    if (sub) ensureFavoriteSubtitleInput();
    const sourceBox = document.querySelector('#st');
    if (!sourceBox) return;
    const firstPlayable = Array.from(sourceBox.querySelectorAll('button[data-i]')).find(el => {
      const row = el.closest('.src');
      return row && !/torrent: not playable|torrent\s*:\s*not playable/i.test(row.textContent || '');
    });
    if (firstPlayable) {
      sessionStorage.removeItem('lumo-quick-play');
      applyFavoriteSubtitle();
      setTimeout(() => firstPlayable.click(), 200);
    }
  }

  function libraryTools() {
    const appEl = root();
    if (!appEl || !/My Library/i.test(appEl.textContent || '') || appEl.querySelector('#lumo-library-tools')) return;
    const grid = appEl.querySelector('.grid');
    if (!grid) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'lumo-library-tools';
    wrapper.className = 'ad';
    wrapper.style.display = 'block';
    wrapper.innerHTML = '<div class="eps"><select id="lumo-library-sort"><option value="name">Sort: Name</option><option value="date">Sort: Date added</option><option value="genre">Sort: Genre</option></select><select id="lumo-library-filter"><option value="all">All titles</option><option value="movie">Movies</option><option value="series">Series</option></select><input id="lumo-library-search" type="search" placeholder="Search Library and collections"></div>';
    grid.parentNode.insertBefore(wrapper, grid);

    const list = Array.isArray(window.S && window.S.lib) ? window.S.lib.slice() : [];
    const sort = wrapper.querySelector('#lumo-library-sort');
    const filt = wrapper.querySelector('#lumo-library-filter');
    const search = wrapper.querySelector('#lumo-library-search');
    sort.value = read('lumo-library-sort', 'name');
    filt.value = read('lumo-library-filter', 'all');
    search.value = read('lumo-library-search', '');

    const cardsFromItems = items => items.map(item => `
      <a class="card" href="#/item/${esc(item.type || 'movie')}/${encodeURIComponent(item.id)}">
        <img loading="lazy" src="${esc(item.poster || '')}" alt="">
        <span>${esc(item.name || 'Untitled')}</span>
      </a>
    `).join('');

    const refresh = () => {
      let items = list.filter(item => {
        const q = search.value.trim().toLowerCase();
        const type = filt.value;
        const matchesType = type === 'all' || String(item.type || '').toLowerCase() === type;
        const matchesSearch = !q || String(item.name || '').toLowerCase().includes(q);
        return matchesType && matchesSearch;
      });

      const mode = sort.value;
      items.sort((a, b) => {
        if (mode === 'date') return (b.t || 0) - (a.t || 0);
        if (mode === 'genre') {
          const ga = String((a.genre || a.genres || []).join(', '));
          const gb = String((b.genre || b.genres || []).join(', '));
          return ga.localeCompare(gb) || String(a.name || '').localeCompare(String(b.name || ''));
        }
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

      write('lumo-library-sort', mode);
      write('lumo-library-filter', filt.value);
      write('lumo-library-search', search.value);
      grid.innerHTML = cardsFromItems(items);
    };

    [sort, filt, search].forEach(el => {
      el.addEventListener('input', refresh);
      el.addEventListener('change', refresh);
    });
    refresh();
  }

  function addonControls() {
    const appEl = root();
    if (!appEl || !appEl.querySelector('#af') || appEl.querySelector('#lumo-addon-controls')) return;
    const urls = Array.isArray(window.S && window.S.urls) ? window.S.urls.slice() : read('urls', []);
    const disabled = new Set(read('lumo-disabled-addons', []));
    const section = document.createElement('div');
    section.id = 'lumo-addon-controls';
    section.className = 'ad';
    section.style.display = 'block';
    section.innerHTML = '<h2>Addon order and switches</h2><p class="muted">Turn a slow or broken addon off without deleting its link. Favorites can be moved to the top.</p>';
    urls.forEach((url, index) => {
      const row = document.createElement('div');
      row.className = 'ad';
      row.style.display = 'flex';
      row.style.justifyContent = 'space-between';
      row.style.alignItems = 'center';
      row.style.gap = '12px';
      row.innerHTML = `
        <div>
          <b>${esc((window.S && window.S.addons && window.S.addons.find(a => a.url === url)?.m?.name) || 'Addon ' + (index + 1))}</b>
          <small class="muted" style="display:block">${esc(url)}</small>
        </div>
        <div class="eps">
          <button type="button" class="ghost" data-lumo-addon-toggle="${index}">${disabled.has(url) ? 'Off' : 'On'}</button>
          <button type="button" class="ghost" data-lumo-addon-up="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" class="ghost" data-lumo-addon-down="${index}" ${index === urls.length - 1 ? 'disabled' : ''}>↓</button>
        </div>
      `;
      section.appendChild(row);
    });
    appEl.querySelector('#af').insertAdjacentElement('afterend', section);

    section.addEventListener('click', event => {
      const toggle = event.target.closest('[data-lumo-addon-toggle]');
      if (toggle) {
        const index = Number(toggle.dataset.lumoAddonToggle);
        const url = urls[index];
        if (!url) return;
        const set = new Set(read('lumo-disabled-addons', []));
        if (set.has(url)) set.delete(url); else set.add(url);
        write('lumo-disabled-addons', Array.from(set));
        toggle.textContent = set.has(url) ? 'Off' : 'On';
        return;
      }

      const up = event.target.closest('[data-lumo-addon-up]');
      if (up) {
        const index = Number(up.dataset.lumoAddonUp);
        if (index <= 0) return;
        const next = urls.slice();
        [next[index], next[index - 1]] = [next[index - 1], next[index]];
        write('urls', next);
        if (window.S) window.S.urls = next;
        location.reload();
      }

      const down = event.target.closest('[data-lumo-addon-down]');
      if (down) {
        const index = Number(down.dataset.lumoAddonDown);
        if (index >= urls.length - 1) return;
        const next = urls.slice();
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
        write('urls', next);
        if (window.S) window.S.urls = next;
        location.reload();
      }
    });
  }

  function patchDisabledAddonsFetch() {
    const nativeFetch = window.fetch.bind(window);
    if (window.__lumoFetchPatched) return;
    window.__lumoFetchPatched = true;
    window.fetch = function(input, init) {
      try {
        const requestUrl = typeof input === 'string' ? input : (input && input.url) ? input.url : '';
        if (!requestUrl) return nativeFetch(input, init);
        const disabled = new Set(read('lumo-disabled-addons', []));
        const urls = Array.isArray(window.S && window.S.urls) ? window.S.urls : read('urls', []);
        const requestHost = (() => { try { return new URL(requestUrl).host; } catch { return ''; } })();
        const hostBlocked = urls.some(url => {
          try {
            return disabled.has(url) && new URL(url).host === requestHost;
          } catch {
            return false;
          }
        });
        if (hostBlocked) return Promise.reject(new TypeError('This addon is disabled.'));
      } catch {}
      return nativeFetch(input, init);
    };
  }

  function pictureInPicture() {
    const video = document.querySelector('#pl');
    if (!video || video.dataset.lumoPipAware) return;
    video.dataset.lumoPipAware = '1';
    const btn = button('⧉ Picture-in-picture');
    btn.style.margin = '8px 0';
    btn.addEventListener('click', async () => {
      if (!document.pictureInPictureEnabled || !video.requestPictureInPicture) {
        alert('Picture-in-picture is not supported in this browser.');
        return;
      }
      try {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture();
        } else {
          await video.requestPictureInPicture();
        }
      } catch {
        alert('Picture-in-picture could not start. Start playback first and try again.');
      }
    });
    video.insertAdjacentElement('afterend', btn);
  }

  function icsEscape(value) {
    return String(value || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }

  function toICSDate(date) {
    return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  }

  function scheduleCalendar() {
    const appEl = root();
    if (!appEl || !/Weekly schedule/i.test(appEl.textContent || '')) return;
    appEl.querySelectorAll('.ad').forEach(row => {
      if (row.querySelector('[data-lumo-calendar]')) return;
      const titleLink = row.querySelector('a[href*="#/item/series/"]');
      if (!titleLink) return;
      const text = row.textContent.replace(/\s+/g, ' ').trim();
      const timeMatch = text.match(/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i) || text.match(/\b(\d{1,2}:\d{2})\b/);
      if (!timeMatch) return;
      const btn = button('📅 Calendar reminder');
      btn.dataset.lumoCalendar = '1';
      btn.addEventListener('click', () => {
        const now = new Date();
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0, 0);
        const start = date;
        const end = new Date(date.getTime() + 60 * 60 * 1000);
        const ics = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//Lumo//Lumo Reminder//EN',
          'BEGIN:VEVENT',
          'UID:' + (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())),
          'DTSTAMP:' + toICSDate(now),
          'DTSTART:' + toICSDate(start),
          'DTEND:' + toICSDate(end),
          'SUMMARY:' + icsEscape(text),
          'BEGIN:VALARM',
          'TRIGGER:-PT30M',
          'ACTION:DISPLAY',
          'DESCRIPTION:' + icsEscape(text),
          'END:VALARM',
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'lumo-reminder.ics';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
      row.appendChild(btn);
    });
  }

  function shareTitle() {
    const appEl = root();
    if (!appEl || !location.hash.startsWith('#/item/') || appEl.querySelector('#lumo-share-title')) return;
    const hero = appEl.querySelector('.hero');
    if (!hero) return;
    const btn = button('Share title');
    btn.id = 'lumo-share-title';
    btn.addEventListener('click', async () => {
      const url = location.href;
      const title = appEl.querySelector('.hero h1')?.textContent || document.title;
      try {
        if (navigator.share) {
          await navigator.share({ title, url });
        } else if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          btn.textContent = 'Link copied';
        }
      } catch {}
    });
    hero.appendChild(btn);
  }

  function setup() {
    attachQuickPlayButtons();
    handleQuickPlayClick();
    handlePendingQuickPlay();
    ensureFavoriteSubtitleInput();
    libraryTools();
    addonControls();
    patchDisabledAddonsFetch();
    pictureInPicture();
    scheduleCalendar();
    shareTitle();
  }

  const appEl = root();
  if (appEl) {
    new MutationObserver(setup).observe(appEl, { childList: true, subtree: true, characterData: true });
  }
  setup();
})();
