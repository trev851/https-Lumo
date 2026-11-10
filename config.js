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
