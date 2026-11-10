// Rename your app here. Supabase details enable sign-in.
window.APP_CONFIG = {
  APP_NAME: "Lumo",
  SUPABASE_URL: "https://aetmxidspudhnfeesocp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_aHvQ8RwT7m1qUeT28vzdEg_Wl9qvCjd"
};

// Profile color themes. Keep this small and independent of the player code.
(() => {
  const themes = {
    lumo: { name: "Lumo (default)", bg: "#0b0f14", panel: "#141a22", line: "#232c38", text: "#eef2f7", muted: "#8b97a8", accent: "#2dd4bf" },
    ocean: { name: "Ocean", bg: "#071521", panel: "#102637", line: "#214458", text: "#e8f4ff", muted: "#9db7ca", accent: "#38bdf8" },
    violet: { name: "Violet", bg: "#130d1b", panel: "#21172d", line: "#3a2a4d", text: "#f5efff", muted: "#b8a8ca", accent: "#c084fc" },
    forest: { name: "Forest", bg: "#0b1510", panel: "#14251b", line: "#294331", text: "#eff8f0", muted: "#a8b9ac", accent: "#4ade80" },
    sunset: { name: "Sunset", bg: "#1a100d", panel: "#2b1b16", line: "#493027", text: "#fff4ed", muted: "#cbb0a0", accent: "#fb923c" }
  };
  const key = "lumo-theme";
  const apply = id => {
    const t = themes[id] || themes.lumo;
    const root = document.documentElement;
    [["--bg", t.bg], ["--pan", t.panel], ["--line", t.line], ["--tx", t.text], ["--mu", t.muted], ["--ac", t.accent]].forEach(([name, value]) => root.style.setProperty(name, value));
    root.dataset.lumoTheme = themes[id] ? id : "lumo";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = t.bg;
    try { localStorage.setItem(key, themes[id] ? id : "lumo"); } catch {}
  };
  let selected = "lumo";
  try { selected = localStorage.getItem(key) || "lumo"; } catch {}
  apply(selected);

  function addThemePicker() {
    const app = document.querySelector("#app");
    if (!app || app.querySelector("#lumoThemePicker")) return;
    const heading = [...app.querySelectorAll("h2")].find(h => h.textContent.trim() === "Appearance");
    if (!heading) return;
    const card = document.createElement("div");
    card.className = "ad";
    card.style.display = "block";
    card.innerHTML = '<label for="lumoThemePicker"><b>Color theme</b><small class="muted" style="display:block">Choose a color palette for Lumo.</small></label><select id="lumoThemePicker" style="margin-top:8px;width:100%"></select>';
    const select = card.querySelector("select");
    Object.entries(themes).forEach(([id, theme]) => {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = theme.name;
      select.append(option);
    });
    try { select.value = localStorage.getItem(key) || "lumo"; } catch { select.value = "lumo"; }
    select.addEventListener("change", () => apply(select.value));
    heading.insertAdjacentElement("afterend", card);
  }

  const app = document.querySelector("#app");
  if (app) new MutationObserver(addThemePicker).observe(app, { childList: true, subtree: true });
  const style = document.createElement("style");
  style.textContent = "header{background:color-mix(in srgb,var(--bg) 93%,transparent)}";
  document.head.append(style);
})();

// Safe profile avatar feature for the current app.
(() => {
  const STORAGE_KEY = "lumo-profile-avatar";
  const PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988c247ac?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80"
  ];

  function loadAvatar() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch {
      return "";
    }
  }

  function saveAvatar(value) {
    try { localStorage.setItem(STORAGE_KEY, value || ""); } catch {}
  }

  function ensureAvatarEditor() {
    const app = document.querySelector("#app");
    if (!app || app.querySelector("#lumo-avatar-editor")) return;
    const heading = [...app.querySelectorAll("h2")].find(h => h.textContent.trim() === "Appearance");
    if (!heading) return;

    const avatar = loadAvatar();
    const block = document.createElement("div");
    block.id = "lumo-avatar-editor";
    block.className = "ad";
    block.style.display = "block";
    block.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <div style="width:72px;height:72px;border-radius:50%;overflow:hidden;background:var(--pan);display:grid;place-items:center;border:1px solid var(--line)">
          <img id="lumo-avatar-preview" src="${avatar || PRESETS[0]}" alt="Profile avatar" style="width:100%;height:100%;object-fit:cover;display:block;">
        </div>
        <div style="flex:1;min-width:180px;">
          <b>Profile avatar</b>
          <small class="muted" style="display:block;margin-top:4px">Use a direct image URL or choose a preset.</small>
        </div>
      </div>
      <div style="margin-top:12px;display:grid;gap:8px;">
        <input id="lumo-avatar-url" type="url" value="${avatar || ""}" placeholder="https://example.com/avatar.png" style="width:100%">
        <div class="eps">
          <button type="button" id="lumo-avatar-save">Save avatar</button>
          <button type="button" class="ghost" id="lumo-avatar-reset">Reset</button>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
        ${PRESETS.map((src, i) => `<button type="button" class="ghost" data-lumo-preset="${src}" style="padding:8px 10px;">Preset ${i + 1}</button>`).join("")}
      </div>
    `;

    heading.insertAdjacentElement("afterend", block);

    const preview = block.querySelector("#lumo-avatar-preview");
    const urlInput = block.querySelector("#lumo-avatar-url");
    const setPreview = src => {
      if (!src) src = PRESETS[0];
      preview.src = src;
      urlInput.value = src;
      saveAvatar(src);
    };

    block.querySelector("#lumo-avatar-save").onclick = () => {
      const val = (urlInput.value || "").trim();
      if (!val) {
        setPreview(PRESETS[0]);
        return;
      }
      setPreview(val);
    };

    block.querySelector("#lumo-avatar-reset").onclick = () => {
      saveAvatar("");
      urlInput.value = "";
      preview.src = PRESETS[0];
    };

    block.querySelectorAll("[data-lumo-preset]").forEach(btn => {
      btn.onclick = () => setPreview(btn.dataset.lumoPreset);
    });
  }

  const app = document.querySelector("#app");
  if (app) new MutationObserver(() => ensureAvatarEditor()).observe(app, { childList: true, subtree: true });
  ensureAvatarEditor();
})();

(() => {
  if (window.__lumoBoostLoaded) return;
  window.__lumoBoostLoaded = true;

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

  function quickPlay(type, id) {
    if (!type || !id) return;
    try {
      sessionStorage.setItem('lumo-quickplay', JSON.stringify({ type, id: String(id) }));
    } catch {}
    location.hash = '#/item/' + type + '/' + encodeURIComponent(id);
  }

  function applySubtitlePreference() {
    const sub = document.getElementById('sub');
    if (!sub || !sub.options || !sub.options.length) return;
    const pref = String(read('lumo-sub-pref', 'eng')).toLowerCase();
    if (!pref) return;
    let chosen = -1;
    Array.from(sub.options).forEach((opt, i) => {
      const text = String(opt.textContent || '').toLowerCase();
      const val = String(opt.value || '').toLowerCase();
      if (chosen < 0 && (text.includes(pref) || val.includes(pref) || text.startsWith(pref))) chosen = i;
    });
    if (chosen >= 0) {
      sub.value = sub.options[chosen].value;
      const video = document.getElementById('pl');
      if (video && window.setSub) window.setSub(video, sub.value);
    }
  }

  function bindQuickButtons() {
    document.querySelectorAll('.card').forEach(card => {
      if (card.querySelector('.lumo-qp')) return;
      const link = card.querySelector('a[href^="#/item/"]');
      if (!link) return;
      const match = link.getAttribute('href').match(/#\/item\/([^/]+)\/(.+)/);
      if (!match) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lumo-qp';
      button.textContent = '▶';
      button.title = 'Quick Play';
      button.dataset.quick = match[1] + '|' + match[2];
      button.style.cssText = 'position:absolute;right:8px;top:8px;z-index:10;padding:6px 8px;border-radius:999px;background:rgba(18,24,30,.9);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:12px;line-height:1;';
      card.style.position = 'relative';
      card.appendChild(button);
    });
  }

  function sortLibraryItems(list) {
    const sort = read('lumo-lib-sort', 'name');
    const items = [...list];
    items.sort((a, b) => {
      if (sort === 'date') return (b.t || 0) - (a.t || 0);
      if (sort === 'genre') {
        const ga = (a.genre || a.genres || []).join(',');
        const gb = (b.genre || b.genres || []).join(',');
        return ga.localeCompare(gb) || String(a.name || '').localeCompare(String(b.name || ''));
      }
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
    return items;
  }

  function enhanceLibraryTools() {
    const app = document.getElementById('app');
    if (!app || !app.innerHTML.includes('My Library')) return;
    const grid = app.querySelector('.grid');
    if (!grid) return;
    if (grid.parentElement && grid.parentElement.querySelector('.lumo-lib-tools')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'lumo-lib-tools ad';
    toolbar.style.display = 'block';
    toolbar.innerHTML = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px;">
        <select id="lumo-lib-sort" style="min-width:140px;">
          <option value="name">Sort: Name</option>
          <option value="date">Sort: Date added</option>
          <option value="genre">Sort: Genre</option>
        </select>
        <select id="lumo-lib-filter" style="min-width:120px;">
          <option value="all">All</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
        </select>
        <input id="lumo-lib-search" type="search" placeholder="Search Library & collections" style="min-width:200px;flex:1;" value="${read('lumo-lib-query', '').replace(/"/g, '&quot;')}">
      </div>
    `;
    grid.parentElement.insertBefore(toolbar, grid);

    const sort = document.getElementById('lumo-lib-sort');
    const filter = document.getElementById('lumo-lib-filter');
    const search = document.getElementById('lumo-lib-search');
    if (sort) sort.value = read('lumo-lib-sort', 'name');
    if (filter) filter.value = read('lumo-lib-filter', 'all');
    if (search) search.value = read('lumo-lib-query', '');

    function refresh() {
      if (!S || !Array.isArray(S.lib)) return;
      const query = (search ? search.value.trim() : '').toLowerCase();
      const mode = (filter ? filter.value : 'all');
      const sortMode = (sort ? sort.value : 'name');
      write('lumo-lib-sort', sortMode);
      write('lumo-lib-filter', mode);
      write('lumo-lib-query', query);

      let items = [...S.lib].map(x => ({ ...x, source: 'library' }));
      if (mode !== 'all') items = items.filter(x => String(x.type || '').toLowerCase() === String(mode).toLowerCase());
      if (query) items = items.filter(x => (x.name || '').toLowerCase().includes(query));
      const collections = Object.keys(S.cols || {}).flatMap(name => (S.cols[name] || []).map(item => ({ ...item, source: 'collection', collection: name })));
      let all = [...items, ...collections];
      const seen = new Set();
      all = all.filter(item => {
        const key = String(item.type || '') + ':' + String(item.id || '') + ':' + String(item.collection || '');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (query) {
        all = all.filter(item => {
          const hay = (item.name || item.collection || '').toLowerCase();
          return hay.includes(query);
        });
      }
      if (mode !== 'all') all = all.filter(item => String(item.type || '').toLowerCase() === String(mode).toLowerCase());
      const ordered = sortLibraryItems(all);
      if (typeof cards === 'function') {
        grid.innerHTML = cards(ordered.slice(0, 200), 'movie');
      } else {
        grid.innerHTML = ordered.map(x => `<div class="card"><a href="#/item/${x.type}/${encodeURIComponent(x.id)}"><img loading="lazy" src="${x.poster || ''}" alt=""><span>${x.name || 'Untitled'}</span></a></div>`).join('');
      }
    }

    [sort, filter, search].forEach(el => {
      if (!el) return;
      el.addEventListener('input', refresh);
      el.addEventListener('change', refresh);
    });

    refresh();
  }

  function enhanceAddonsUI() {
    const app = document.getElementById('app');
    if (!app || !document.getElementById('af')) return;
    const rows = Array.from(app.querySelectorAll('.ad')).filter(el => el.querySelector('b') && el.querySelector('small'));
    if (!rows.length || rows[0].querySelector('[data-lumo-addon-toggle]')) return;

    rows.forEach((row, index) => {
      const url = Array.isArray(S.urls) ? S.urls[index] : null;
      if (!url || row.querySelector('[data-lumo-addon-toggle]')) return;
      const enabled = !(S.addonState && S.addonState[url] === false);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.dataset.lumoAddonToggle = String(index);
      toggle.className = 'ghost';
      toggle.textContent = enabled ? 'On' : 'Off';
      toggle.style.margin = '0 6px';
      row.appendChild(toggle);

      const up = document.createElement('button');
      up.type = 'button';
      up.dataset.lumoAddonOrder = 'up:' + index;
      up.className = 'ghost';
      up.textContent = '↑';
      row.appendChild(up);

      const down = document.createElement('button');
      down.type = 'button';
      down.dataset.lumoAddonOrder = 'down:' + index;
      down.className = 'ghost';
      down.textContent = '↓';
      row.appendChild(down);
    });
  }

  function applyCalendarReminders() {
    const app = document.getElementById('app');
    if (!app || !app.innerHTML.includes('Weekly schedule')) return;
    document.querySelectorAll('[data-lumo-calendar]').forEach(el => el.remove());
    const cards = app.querySelectorAll('.ad');
    cards.forEach(card => {
      if (!card.innerHTML.includes('S') || card.querySelector('[data-lumo-calendar]')) return;
      const text = card.textContent || '';
      const match = text.match(/S(\d+)E(\d+)/);
      if (!match || !card.querySelector('a')) return;
      const link = card.querySelector('a');
      const href = link.getAttribute('href') || '#';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lumoCalendar = href;
      button.className = 'ghost';
      button.textContent = '📅';
      button.title = 'Add to calendar';
      button.style.marginLeft = '8px';
      card.appendChild(button);
    });
  }

  function makeIcsEntry(title, when) {
    const start = new Date(when);
    const end = new Date(start.getTime() + 30 * 60000);
    const fmt = value => value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:' + 'lumo-' + Math.random().toString(36).slice(2) + '@local',
      'DTSTAMP:' + fmt(new Date()),
      'DTSTART:' + fmt(start),
      'DTEND:' + fmt(end),
      'SUMMARY:' + title.replace(/[,;\\]/g, ''),
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
  }

  function handleDocumentClicks(event) {
    const quick = event.target.closest('[data-quick]');
    if (quick) {
      const [type, id] = String(quick.dataset.quick).split('|');
      event.preventDefault();
      quickPlay(type, id);
      return;
    }

    const addonToggle = event.target.closest('[data-lumo-addon-toggle]');
    if (addonToggle) {
      const idx = Number(addonToggle.dataset.lumoAddonToggle || 0);
      if (Array.isArray(S.urls) && S.urls[idx]) {
        const url = S.urls[idx];
        S.addonState = S.addonState || {};
        S.addonState[url] = !(S.addonState[url] === false);
        write('addonState', S.addonState);
        if (window.location.hash === '#/addons' || window.location.hash.startsWith('#/discover')) {
          window.location.reload();
        }
      }
      return;
    }

    const addonOrder = event.target.closest('[data-lumo-addon-order]');
    if (addonOrder) {
      const value = addonOrder.dataset.lumoAddonOrder || '';
      const [mode, rawIndex] = value.split(':');
      const idx = Number(rawIndex || 0);
      if (Array.isArray(S.urls) && idx >= 0 && idx < S.urls.length) {
        const next = idx + (mode === 'up' ? -1 : 1);
        if (next >= 0 && next < S.urls.length) {
          const list = [...S.urls];
          [list[idx], list[next]] = [list[next], list[idx]];
          S.urls = list;
          write('urls', S.urls);
          window.location.reload();
        }
      }
      return;
    }

    const calendar = event.target.closest('[data-lumo-calendar]');
    if (calendar) {
      event.preventDefault();
      const href = calendar.dataset.lumoCalendar || '';
      const title = (calendar.closest('.ad')?.textContent || '').replace(/\s+/g, ' ').trim() || 'Lumo schedule';
      const match = title.match(/S\d+E\d+/);
      const when = match ? new Date() : new Date();
      const blob = new Blob([makeIcsEntry(title, when)], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'lumo-schedule.ics';
      anchor.click();
      URL.revokeObjectURL(url);
      return;
    }
  }

  function enhancePlayer() {
    const video = document.getElementById('pl');
    if (!video) return;
    if (video.dataset.lumoPipBound) return;
    video.dataset.lumoPipBound = '1';
    const wrapper = video.parentElement || document.body;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ghost';
    button.textContent = 'Picture in Picture';
    button.style.margin = '8px 0';
    button.onclick = async () => {
      if (!document.pictureInPictureEnabled || !video) return;
      try {
        if (document.pictureInPictureElement !== video) {
          await video.requestPictureInPicture();
        } else {
          await document.exitPictureInPicture();
        }
      } catch {} 
    };
    wrapper.appendChild(button);
  }

  function enhanceItemScreen() {
    if (!document.getElementById('pl')) return;
    const key = 'lumo-quickplay';
    try {
      const quick = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (quick && quick.type && quick.id) {
        const same = (S && S.type && S.id) || (window.CUR && window.CUR.type && window.CUR.id);
        if ((window.CUR && window.CUR.type === quick.type && window.CUR.id === quick.id) || (same && same.type === quick.type && same.id === quick.id)) {
          setTimeout(() => {
            if (typeof streams === 'function') streams(quick.type, quick.id, true);
            if (document.getElementById('sub')) applySubtitlePreference();
          }, 250);
        }
      }
    } catch {}
  }

  function observe() {
    bindQuickButtons();
    enhanceLibraryTools();
    enhanceAddonsUI();
    applyCalendarReminders();
    enhancePlayer();
    enhanceItemScreen();
    applySubtitlePreference();
    const sub = document.getElementById('sub');
    if (sub && !sub.dataset.lumoBound) {
      sub.dataset.lumoBound = '1';
      sub.addEventListener('change', () => {
        const selected = sub.options[sub.selectedIndex];
        const lang = selected && selected.textContent ? String(selected.textContent).trim().split(' ')[0].toLowerCase() : String(sub.value || '').toLowerCase();
        if (lang) {
          write('lumo-sub-pref', lang);
        }
        if (document.getElementById('pl') && window.setSub) {
          window.setSub(document.getElementById('pl'), sub.value);
        }
      });
    }
  }

  document.addEventListener('click', handleDocumentClicks, true);
  const app = document.getElementById('app');
  if (app) {
    new MutationObserver(observe).observe(app, { childList: true, subtree: true, characterData: true });
  }

  observe();
})();
