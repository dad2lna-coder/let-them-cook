// js/components/navigation.js — Shell navigation controller for LTC-9
import { state } from '../stores/state.js';

export function renderSidebar(payload) {
  const recent = payload?.initiatives?.filter((init) => init.status !== 'Completed').slice(0, 5) || [];
  const container = document.getElementById('sidebar-recent');
  if (!container) return;
  if (recent.length === 0) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = recent.map((init) => {
    const name = init.name || 'Unnamed';
    const date = init.updatedAt ? new Date(init.updatedAt).toLocaleDateString() : '—';
    return `<div class="sidebar-recent-item" data-init-id="${init.id}" onclick="openInitiativeEditor('${init.id}')">${name} <span class="text-sm text-muted-600">${date}</span></div>`;
  }).join('');

  const synced = document.getElementById('sidebar-synced');
  if (synced) {
    synced.textContent = payload?.updatedAt
      ? new Date(payload.updatedAt).toLocaleString()
      : 'Browser demo';
  }
}

export function markActiveTab(tabName) {
  // top-bar tabs removed in LTC-25a — workspace links own active state
  document.querySelectorAll('.workspace-link').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === 'initiatives' || t.dataset.filter !== undefined);
  });
}

export function bindShellNavigation() {
  // top-bar tabs removed in LTC-25a — workspace links own tab switching
  document.querySelectorAll('.workspace-link[data-action="tab"]').forEach(btn => {
    btn.addEventListener('click', () => state.switchTab(btn.dataset.tab));
  });
}

export function initNavigation() {
  bindShellNavigation();
  const payload = state.getCurrentPayload();
  if (payload) {
    renderSidebar(payload);
  }
}
