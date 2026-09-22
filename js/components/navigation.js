// js/components/navigation.js — Shell navigation controller for LTC-9
import { state } from '../stores/state.js';
import { escapeHtml } from '../utils/strings.js';

export function renderSidebar(payload) {
  const container = document.getElementById('sidebar-problems');
  if (!container) return;

  const problems = payload?.problems || [];

  // Group problems: Active first, then Solved
  const active = problems.filter(p => p.status !== 'Solved');
  const solved = problems.filter(p => p.status === 'Solved');

  function renderProblemGroup(title, group) {
    const html = group.length === 0
      ? `<div class="sidebar-tree-group"><span class="sidebar-tree-muted">None</span></div>`
      : group.map(p => {
          const statusClass = p.status === 'Solved' ? 'sidebar-tree-solved' : 'sidebar-tree-active';
          return `<div class="sidebar-tree-item ${statusClass}" data-action="open-problem" data-id="${p.id}">${escapeHtml(p.title || 'Unnamed')}</div>`;
        }).join('');
    return `<div class="sidebar-tree-group"><strong>${escapeHtml(title)}</strong>${html}</div>`;
  }

  container.innerHTML = `
    ${renderProblemGroup('Active', active)}
    ${renderProblemGroup('Solved', solved)}
  `;

  // Initiatives tree (#sidebar-initiatives)
  const initContainer = document.getElementById('sidebar-initiatives');
  if (initContainer) {
    const initiatives = payload?.initiatives || [];
    const statusOrder = ['New', 'Planning', 'Active', 'Completed'];

    function renderInitGroup(title, statusVal) {
      const group = initiatives.filter(i => i.status === statusVal);
      const html = group.length === 0
        ? `<div class="sidebar-tree-group"><span class="sidebar-tree-muted">None</span></div>`
        : group.map(i => {
          return `<div class="sidebar-tree-item" data-action="open-initiative" data-id="${i.id}">${escapeHtml(i.name || 'Unnamed')}</div>`;
        }).join('');
      return `<div class="sidebar-tree-group"><strong>${escapeHtml(title)}</strong>${html}</div>`;
    }

    initContainer.innerHTML = statusOrder.map(status => renderInitGroup(status, status)).join('');
  }

  // Update #sidebar-synced as today
  const synced = document.getElementById('sidebar-synced');
  if (synced) {
    synced.textContent = new Date().toLocaleString();
  }
}

/**
 * Mark the active Dashboard/Analytics sidebar-nav-btn based on current tab.
 * Also optionally adds .active on the matching tree item when on detail pages.
 */
export function markActiveTab(tabName) {
  const btnDashboard = document.querySelector('button.sidebar-nav-btn[data-tab="dashboard"]');
  const btnAnalytics = document.querySelector('button.sidebar-nav-btn[data-tab="analytics"]');

  if (btnDashboard) btnDashboard.classList.toggle('active', tabName === 'dashboard');
  if (btnAnalytics) btnAnalytics.classList.toggle('active', tabName === 'analytics');

  // Nice-to-have: add .active on matching tree item when on problems/initiatives detail
  // (not required for DONE WHEN)
}

export function bindShellNavigation() {
  // Sidebar nav buttons and tree items are bound globally via state.bindUiEvents.
  // This hook is intentionally lightweight; main binding lives there.
}

export function initNavigation() {
  bindShellNavigation();
  const payload = state.getCurrentPayload();
  if (payload) {
    renderSidebar(payload);
  }
}