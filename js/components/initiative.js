// js/components/initiative.js — Initiative manager: list + detail + CRUD aligned to index.html page structure
import { state } from '../stores/state.js';
import { renderSection } from './section.js';
import { renderNotesForInitiative } from './notes.js';

function collectTablePayload(tableId) {
  const rows = [];
  document.querySelectorAll(`#${tableId} tbody tr`).forEach((row, index) => {
    const cells = row.querySelectorAll("td");
    rows.push({
      id: `${tableId}-${index + 1}`,
      idea: cells[0]?.innerText?.trim() || "",
      contributor: cells[1]?.innerText?.trim() || "",
      prosAndConcerns: cells[2]?.innerText?.trim() || "",
      feedback: Number(cells[3]?.querySelector(".feedback-number")?.textContent || 0),
      deleted: row.getAttribute('data-deleted') === 'true'
    });
  });
  return rows;
}

function collectTasksForPanel(taskListId) {
  const taskList = document.getElementById(taskListId);
  if (!taskList) return [];
  return Array.from(taskList.querySelectorAll("li")).map((li, index) => {
    const checkbox = li.querySelector("input[type='checkbox']");
    const span = li.querySelector("span");
    return { id: `${taskListId}-task-${index + 1}`, text: span?.innerText.trim() || "", complete: Boolean(checkbox?.checked) };
  });
}

function collectQuestionsForPanel(listId) {
  const list = document.getElementById(listId);
  if (!list) return [];
  return Array.from(list.querySelectorAll("li span")).map(span => span.innerText.trim()).filter(Boolean);
}

const BRIEFING_KINDS = ["who","what","when","where","why","how"];

function kindLabel(kind) {
  return ({ who:"Who", what:"What", when:"When", where:"Where", why:"Why", how:"How" })[kind] || kind;
}

function ensureBriefing(init) {
  if (!Array.isArray(init.briefing)) init.briefing = [];
  return init.briefing;
}

function toggleToolbarButtons(visible) {
  const toolbar = document.querySelector('.initiative-toolbar');
  if (!toolbar) return;
  const buttons = toolbar.querySelectorAll('button');
  buttons.forEach(btn => {
    if (visible) {
      btn.style.display = '';
      btn.disabled = false;
    } else {
      btn.style.display = 'none';
    }
  });
}

function setDeleteButtonId(id) {
  const toolbar = document.querySelector('.initiative-toolbar');
  if (!toolbar) return;
  const deleteBtn = toolbar.querySelector('[data-action="delete-initiative"]');
  if (deleteBtn) deleteBtn.dataset.id = id;
}

function paintBriefing(init) {
  const list = document.getElementById("briefing-list");
  const empty = document.getElementById("briefing-empty");
  if (!list) return;
  const rows = ensureBriefing(init);
  list.innerHTML = "";
  if (empty) empty.hidden = rows.length > 0;
  rows.forEach(row => {
    const wrap = document.createElement("div");
    wrap.className = "briefing-row";
    wrap.dataset.id = row.id;
    wrap.innerHTML = `
      <div class="briefing-row-head">
        <span class="briefing-pill">${kindLabel(row.kind)}</span>
        <button type="button" class="quiet" data-action="delete-briefing" data-id="${row.id}">Delete</button>
      </div>
      <textarea class="field textarea briefing-body" data-id="${row.id}" rows="3" placeholder="${kindLabel(row.kind)}…"></textarea>`;
    const ta = wrap.querySelector("textarea");
    ta.value = row.body || "";
    ta.addEventListener("input", () => {
      const hit = ensureBriefing(init).find(r => r.id === row.id);
      if (hit) hit.body = ta.value;
      state.cachePayload();
    });
    list.appendChild(wrap);
  });
}

export function toggleBriefingPicker() {
  // No-op: briefing picker menu removed in LTC-27
}

export function addBriefingRow(kind) {
  const payload = state.getCurrentPayload();
  const initId = state.getCurrentInitiativeId();
  const init = (payload?.initiatives || []).find(i => i.id === initId);
  if (!init || !BRIEFING_KINDS.includes(kind)) return;
  ensureBriefing(init).push({ id: "brf-" + Date.now(), kind, body: "" });
  state.setCurrentPayload(payload);
  paintBriefing(init);
  const ta = document.querySelector(`#briefing-list .briefing-body[data-id="${ensureBriefing(init).at(-1).id}"]`);
  ta?.focus();
  state.cachePayload();
}

export function deleteBriefingRow(id) {
  const payload = state.getCurrentPayload();
  const initId = state.getCurrentInitiativeId();
  const init = (payload?.initiatives || []).find(i => i.id === initId);
  if (!init) return;
  init.briefing = ensureBriefing(init).filter(r => r.id !== id);
  state.setCurrentPayload(payload);
  paintBriefing(init);
  state.cachePayload();
}

// ------------------------------------------------------------------
// Render: Initiative list view
// ------------------------------------------------------------------
export function renderInitiativeList(payload) {
  const container = document.getElementById('initiative-list');
  if (!container) return;
  container.innerHTML = '';
  const initiatives = payload.initiatives || [];
  initiatives.forEach(init => {
    const card = document.createElement('div');
    card.className = 'initiative-card';
    card.dataset.id = init.id;
    const ideaCount = (init.sections || []).reduce((sum, sec) => sum + (sec.ideas || []).length, 0);
    const actionCount = (init.sections || []).reduce((sum, sec) => sum + (sec.actions || []).length, 0);
    const openActions = (init.sections || []).reduce((sum, sec) => sum + (sec.actions || []).filter(a => !a.complete).length, 0);
    const notesCount = (init.notes || []).length;
    card.innerHTML = `
      <div class="initiative-header">
        <h4>${state.escapeHtml(init.name || 'Unnamed initiative')}</h4>
        <span class="status-pill status-${(init.status || 'New').toLowerCase()}">${init.status || 'New'}</span>
      </div>
      <div class="initiative-meta">
        <span>Sections: ${(init.sections || []).length}</span>
        <span>Ideas: ${ideaCount}</span>
        <span>Actions: ${openActions}/${actionCount}</span>
        <span>Notes: ${notesCount}</span>
      </div>
      ${init.startDate ? `<div class="initiative-start">Started ${state.escapeHtml(init.startDate)}</div>` : ''}
      ${init.problemId ? `<div class="initiative-problem-meta">Problem: ${state.escapeHtml((payload.problems || []).find(p => p.id === init.problemId)?.title || init.problemId)}</div>` : ''}
      <div class="initiative-actions">
        <button type="button" class="secondary" data-action="open-initiative" data-id="${init.id}">Open</button>
        <button type="button" class="danger" data-action="delete-initiative" data-id="${init.id}">Delete</button>
      </div>
    `;
    container.appendChild(card);
  });
  // Wire add/delete/open via data-action (handled by state.bindUiEvents)
  container.querySelectorAll('[data-action="open-initiative"]').forEach(btn => {
    btn.addEventListener('click', () => openInitiativeEditor(btn.dataset.id, payload));
  });
  container.querySelectorAll('[data-action="delete-initiative"]').forEach(btn => {
    btn.addEventListener('click', () => deleteInitiative(btn.dataset.id, payload));
  });
  // Show detail view
  const listView = document.getElementById('initiative-list-view');
  const detailView = document.getElementById('initiative-detail-view');
  if (listView) listView.hidden = false;
  if (detailView) detailView.hidden = true;
  toggleToolbarButtons(false);
}

// ------------------------------------------------------------------
// Render: Initiative detail view (edit properties + sections + notes)
// ------------------------------------------------------------------
export function renderInitiativeEditor(init, payload) {
  const listView = document.getElementById('initiative-list-view');
  const detailView = document.getElementById('initiative-detail-view');
  if (!listView || !detailView) return;
  listView.hidden = true;
  detailView.hidden = false;

  const titleEl = document.getElementById('initiative-detail-title');
  if (titleEl) titleEl.textContent = `Editing: ${init.name || 'New Initiative'}`;

  // Detail toolbar title uses data-action="save-initiative" and "back-initiatives"
  const nameInput = document.getElementById('initiative-name');
  const statusSelect = document.getElementById('initiative-status');
  const startDateInput = document.getElementById('initiative-start-date');
  const problemSelect = document.getElementById('initiative-problem');

  if (nameInput) nameInput.value = init.name || '';
  if (statusSelect) statusSelect.value = init.status || 'New';
  if (startDateInput) startDateInput.value = init.startDate || '';
  if (problemSelect) fillProblemSelect(payload, init.problemId || '');

  const sectionsContainer = document.getElementById('sections-container');
  if (sectionsContainer) {
    sectionsContainer.innerHTML = '';
    (init.sections || []).forEach((section, index) => {
      renderSection(section, index, init.id, sectionsContainer);
    });
  }

  // Bind the detail toolbar delete button to the current initiative.
  const detailDeleteBtn = document.getElementById('initiative-detail-view')?.querySelector('[data-action="delete-initiative"]');
  if (detailDeleteBtn) {
    detailDeleteBtn.dataset.id = init.id;
  }
  setDeleteButtonId(init.id);
  toggleToolbarButtons(true);

  paintBriefing(init);

  // Render notes panel
  renderNotesForInitiative(init);
}

function fillProblemSelect(payload, selectedId) {
  const select = document.getElementById('initiative-problem');
  if (!select) return;
  
  // Clear existing options except the first "— None —" option
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Add problem options
  const problems = payload?.problems || [];
  problems.forEach(problem => {
    const option = document.createElement('option');
    option.value = problem.id;
    const label = problem.status === 'Solved'
      ? `${problem.title || 'Unnamed problem'} (Solved)`
      : (problem.title || 'Unnamed problem');
    option.textContent = label;
    select.appendChild(option);
  });

  // Set selected value
  select.value = selectedId;
}

export function openInitiativeEditor(id, payload) {
  payload = payload || state.getCurrentPayload();
  if (!payload) return;
  const init = (payload.initiatives || []).find(i => i.id === id);
  if (!init) return;
  state.setCurrentInitiativeId(id);
  renderInitiativeEditor(init, payload);
}

export function addInitiative(payload, problemId) {
  payload = payload || state.getCurrentPayload();
  if (!payload) return;
  const initiatives = payload.initiatives || [];
  const newId = 'init-' + Date.now();
  const newInitiative = {
    id: newId,
    name: 'New Initiative',
    status: 'New',
    startDate: '',
    briefing: [],
    notes: [],
    sections: [
      {
        id: newId + '-sec-1',
        type: 'discovery',
        name: 'Discovery',
        notes: [],
        ideas: [],
        actions: [],
        questions: [],
        flow: null
      }
    ],
    problemId: problemId || ''
  };
  initiatives.push(newInitiative);
  payload.initiatives = initiatives;
  state.setCurrentPayload(payload);
  state.setCurrentInitiativeId(newId);
  // Switch to initiatives tab if we're coming from a problem page
  if (state.getCurrentTab && state.getCurrentTab() !== 'initiatives') {
    state.switchTab('initiatives');
  }
  openInitiativeEditor(newId, payload);
  return newInitiative;
}

export function deleteInitiative(id, payload) {
  payload = payload || state.getCurrentPayload();
  if (!payload) return;
  if (!confirm('Delete this initiative and all its sections? This cannot be undone.')) return;
  payload.initiatives = (payload.initiatives || []).filter(i => i.id !== id);
  state.setCurrentPayload(payload);
  renderInitiativeList(payload);
}

export function addSection() {
  const payload = state.getCurrentPayload();
  if (!payload) return;
  const initId = state.getCurrentInitiativeId();
  const init = (payload.initiatives || []).find(i => i.id === initId);
  if (!init) return;
  const sectionId = initId + '-sec-' + (init.sections.length + 1);
  const newSection = {
    id: sectionId,
    type: 'discovery',
    name: 'Section ' + (init.sections.length + 1),
    notes: [],
    ideas: [],
    actions: [],
    questions: [],
    flow: null
  };
  init.sections.push(newSection);
  state.setCurrentPayload(payload);
  renderInitiativeEditor(init, payload);
}

export function saveCurrentInitiative(payload) {
  payload = payload || state.getCurrentPayload();
  const initId = state.getCurrentInitiativeId();
  if (!initId || !payload) return;
  const init = (payload.initiatives || []).find(i => i.id === initId);
  if (!init) return;
  init.name = document.getElementById('initiative-name')?.value.trim() || 'Unnamed';
  init.status = document.getElementById('initiative-status')?.value || 'New';
  init.startDate = document.getElementById('initiative-start-date')?.value || '';
  init.problemId = document.getElementById('initiative-problem')?.value || '';
  init.briefing = Array.from(document.querySelectorAll("#briefing-list .briefing-row")).map(row => {
    const id = row.dataset.id;
    const kind = (ensureBriefing(init).find(r => r.id === id)?.kind) || "what";
    const body = row.querySelector("textarea")?.value || "";
    return { id, kind, body };
  });
  // Notes are managed by notes.js and stored in payload
  const sectionsContainer = document.getElementById('sections-container');
  if (sectionsContainer && init.sections) {
    init.sections = [];
    sectionsContainer.querySelectorAll('.section-editor').forEach(sectionEl => {
      const secId = sectionEl.dataset.id;
      const ideas = collectTablePayload(secId + '-ideas');
      const actions = collectTasksForPanel(secId + '-task-list');
      const questions = collectQuestionsForPanel(secId + '-question-list');
      const notes = collectNotesForSection(secId + '-notes');
      init.sections.push({
        id: secId,
        name: sectionEl.querySelector('.section-name')?.value || 'Section',
        type: sectionEl.dataset.type || 'discovery',
        notes: Array.isArray(notes) ? notes : [],
        ideas,
        actions,
        questions,
        flow: null
      });
    });
  }
  state.setCurrentPayload(payload);
  renderInitiativeList(payload);
  state.cachePayload();
}

export function backToInitiativesList() {
  state.setCurrentInitiativeId(null);
  const listView = document.getElementById('initiative-list-view');
  const detailView = document.getElementById('initiative-detail-view');
  if (listView) listView.hidden = false;
  if (detailView) detailView.hidden = true;
  toggleToolbarButtons(false);
  renderInitiativeList(state.getCurrentPayload());
}

// Collect notes from a notes panel DOM element
function collectNotesForSection(notesListId) {
  const list = document.getElementById(notesListId);
  if (!list) return [];
  const notes = [];
  list.querySelectorAll('.note[data-id]:not(.reply)').forEach(noteEl => {
    const id = noteEl.dataset.id;
    const bodyEl = noteEl.querySelector('.note-body');
    const authorEl = noteEl.querySelector('.note-author');
    const createdAt = noteEl.dataset.createdAt || new Date().toISOString();
    const note = {
      id,
      body: bodyEl?.innerText.trim() || '',
      author: authorEl?.value || authorEl?.innerText.trim() || '',
      createdAt,
      parentId: null,
      replies: []
    };
    // Collect replies
    const repliesContainer = noteEl.querySelector('.note-replies');
    if (repliesContainer) {
      repliesContainer.querySelectorAll('.note.reply').forEach(replyEl => {
        const replyId = replyEl.dataset.id;
        const replyBodyEl = replyEl.querySelector('.note-body');
        const replyAuthorEl = replyEl.querySelector('.note-author');
        note.replies.push({
          id: replyId,
          body: replyBodyEl?.innerText.trim() || '',
          author: replyAuthorEl?.value || replyAuthorEl?.innerText.trim() || '',
          createdAt: replyEl.dataset.createdAt || new Date().toISOString(),
          parentId: id
        });
      });
    }
    notes.push(note);
  });
  return notes;
}

export { collectTablePayload, collectTasksForPanel, collectQuestionsForPanel, collectNotesForSection };
