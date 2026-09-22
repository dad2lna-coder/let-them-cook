// Theme management for LTC-14 theme modal
const STORAGE_KEY = "let-them-cook-theme-v2";

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
  updateThemeUI(name);
}

/**
 * Update theme choice buttons and sidebar theme label
 * @param {string} name - current theme name
 */
export function updateThemeUI(name) {
  document.querySelectorAll(".theme-choice").forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.theme === name ? "true" : "false");
  });
  const sidebarBtn = document.querySelector('[data-action="open-theme"]');
  if (sidebarBtn) {
    sidebarBtn.textContent = `Theme: ${name === "tsa" ? "TSA" : "Default"}`;
  }
}

/**
 * Open theme modal and focus first choice
 */
export function openThemeModal() {
  const modal = document.getElementById("theme-modal");
  if (!modal) return;
  modal.hidden = false;
  updateThemeUI(getTheme());
  const firstChoice = modal.querySelector(".theme-choice");
  if (firstChoice) firstChoice.focus();
}

/**
 * Close theme modal
 */
export function closeThemeModal() {
  const modal = document.getElementById("theme-modal");
  if (!modal) return;
  modal.hidden = true;
}

/**
 * Apply theme and close modal
 * @param {string} name - "tsa" or "default"
 */
export function setTheme(name) {
  applyTheme(name);
  closeThemeModal();
}

/**
 * Initialize theme on page load - apply stored or default theme
 */
export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeThemeModal();
  });
}
