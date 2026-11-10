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
