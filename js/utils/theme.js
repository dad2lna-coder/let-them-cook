// Theme management for LTC-13 TSA theme toggle
const STORAGE_KEY = "***";

/**
 * Get current theme from localStorage, defaults to "tsa"
 * @returns {string} "tsa" or "default"
 */
export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || "tsa";
}

/**
 * Apply theme by setting data attribute and localStorage
 * @param {string} name - "tsa" or "default"
 */
export function applyTheme(name) {
  document.documentElement.dataset.theme = name;
  localStorage.setItem(STORAGE_KEY, name);
  updateThemeToggle(name);
}

/**
 * Update theme toggle button text and aria-pressed
 * @param {string} name - current theme name
 */
function updateThemeToggle(name) {
  const toggle = document.querySelector(".theme-toggle");
  if (!toggle) return;
  
  const isTsa = name === "tsa";
  toggle.textContent = `Theme: ${isTsa ? "TSA" : "Default"}`;
  toggle.setAttribute("aria-pressed", isTsa.toString());
  toggle.title = isTsa ? "Switch to Default theme" : "Switch to TSA theme";
}

/**
 * Toggle between TSA and default themes
 */
export function toggleTheme() {
  const current = getTheme();
  const next = current === "tsa" ? "default" : "tsa";
  applyTheme(next);
}

/**
 * Initialize theme on page load - apply stored or default theme
 */
export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
}