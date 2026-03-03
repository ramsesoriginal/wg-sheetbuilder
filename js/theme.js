// js/theme.js
const STORAGE_KEY = "wg.theme";
const DEFAULT_THEME = "administratum";

const themeLink = document.getElementById("theme-css");
const themeSelect = document.getElementById("themeSelect");

function themeHref(themeName) {
  // themeName maps directly to css/themes/<name>.css
  return `css/themes/${themeName}.css`;
}

function applyTheme(themeName) {
  const safeTheme = themeName || DEFAULT_THEME;
  if (themeLink) themeLink.setAttribute("href", themeHref(safeTheme));
  if (themeSelect) themeSelect.value = safeTheme;
}

function loadTheme() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
}

function saveTheme(themeName) {
  localStorage.setItem(STORAGE_KEY, themeName);
}

document.addEventListener("DOMContentLoaded", () => {
  // Apply saved theme on load
  applyTheme(loadTheme());

  // Wire dropdown if present
  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      const next = e.target.value;
      applyTheme(next);
      saveTheme(next);
    });
  }
});
