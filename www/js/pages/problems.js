import { state } from "../stores/state.js";
import { escapeHtml } from "../utils/strings.js";

function getProblemEditor() {
  return document.getElementById("problem-editor");
}

function getProblemList() {
  const listSection = document.getElementById("page-problems");
  return listSection ? listSection.querySelector(".problem-list") : null;
}

function getProblemForm() {
  return {
    title: document.getElementById("problem-title")?.value.trim() || "",
    body: document.getElementById("problem-body")?.value.trim() || "",
    priority: document.getElementById("problem-priority")?.value || "medium"
  };
}

function validateProblemForm(form) {
  return !!(form.title && form.body);
}

export function renderProblemsPage(payload) {
  const listContainer = document.getElementById("problems-list");
  if (!listContainer) return;
  listContainer.innerHTML = "";
  const problems = payload.problems || [];
  if (problems.length === 0) {
    listContainer.innerHTML = '<div class="empty-state">No problems yet. Click "Add problem" to start.</div>';
    return;
  }
  problems.forEach(problem => {
    const card = document.createElement("div");
    card.className = "problem-card";
    card.dataset.id = problem.id;
    const linkedCount = (payload.initiatives || []).filter(i => i.problemId === problem.id).length;
    card.innerHTML = `
      <div class="problem-header">
        <strong>${escapeHtml(problem.title || "")}</strong>
        <span class="priority-pill priority-${problem.priority || "medium"}">${problem.priority || "medium"}</span>
        <span class="problem-status-badge ${problem.status === 'Solved' ? 'is-solved' : 'is-active'}">${problem.status || 'Active'}</span>
      </div>
      <div class="problem-body editable-content" contenteditable="true">${escapeHtml(problem.body || "")}</div>
      <div class="problem-meta">
        <span>${linkedCount} initiative${linkedCount !== 1 ? 's' : ''}</span>
      </div>
      <div class="problem-footer">
        <button type="button" class="secondary" onclick="window.editProblem('${problem.id}')">Edit</button>
        <button type="button" class="danger" onclick="window.deleteProblem('${problem.id}')">Delete</button>
        <button type="button" class="success" data-action="add-initiative-for-problem" data-id="${problem.id}">+ Initiative</button>
        ${problem.status === 'Solved' ? '<button type="button" class="warning" data-action="mark-problem-active" data-id="' + problem.id + '">Reopen</button>' : '<button type="button" class="primary" data-action="mark-problem-solved" data-id="' + problem.id + '">Mark solved</button>'}
      </div>
    `;
    listContainer.appendChild(card);
  });
}

export function showProblemEditor(problemId = null) {
  const editor = getProblemEditor();
  const listSection = document.getElementById("page-problems");
  if (!editor || !listSection) return;
  listSection.querySelector(".problem-list").style.display = "none";
  editor.hidden = false;
  editor.style.display = "block";
  const titleEl = document.getElementById("problem-editor-title");
  if (titleEl) titleEl.textContent = problemId ? "Edit problem" : "Add problem";
  const titleInput = document.getElementById("problem-title");
  const bodyInput = document.getElementById("problem-body");
  const prioritySelect = document.getElementById("problem-priority");
  const statusSelect = document.getElementById("problem-status");
  if (titleInput) titleInput.value = "";
  if (bodyInput) bodyInput.value = "";
  if (prioritySelect) prioritySelect.value = "medium";
  if (statusSelect) statusSelect.value = "Active";
  const deleteBtn = editor.querySelector('[data-action="delete-problem"]');
  if (problemId) {
    const payload = state.getCurrentPayload();
    const problem = (payload?.problems || []).find(p => p.id === problemId);
    if (problem) {
      if (titleInput) titleInput.value = problem.title || "";
      if (bodyInput) bodyInput.value = problem.body || "";
      if (prioritySelect) prioritySelect.value = problem.priority || "medium";
      if (statusSelect) statusSelect.value = problem.status || "Active";
      if (deleteBtn) { deleteBtn.dataset.id = problemId; deleteBtn.style.display = "inline-block"; }
    }
  } else if (deleteBtn) {
    deleteBtn.style.display = "none";
  }
}

export function hideProblemEditor() {
  const editor = getProblemEditor();
  const listSection = document.getElementById("page-problems");
  if (!editor || !listSection) return;
  editor.hidden = true;
  editor.style.display = "none";
  listSection.querySelector(".problem-list").style.display = "block";
}

export function collectProblemForm() {
  return getProblemForm();
}

export function editProblem(id) {
  showProblemEditor(id);
}

export function setProblemStatus(id, status) {
  const payload = state.getCurrentPayload();
  if (!payload || !Array.isArray(payload.problems)) return;
  const now = new Date().toISOString();
  const problem = payload.problems.find(p => p.id === id);
  if (!problem) return;
  problem.status = status;
  if (status === "Solved") {
    problem.solvedAt = problem.solvedAt || now;
  } else {
    problem.solvedAt = "";
  }
  state.setCurrentPayload(payload);
  renderProblemsPage(payload);
  try { if (typeof state.renderCurrentTab === "function") state.renderCurrentTab(state.getCurrentPayload()); } catch (_) { /* ignore */ }
  try { if (typeof state.cachePayload === "function") state.cachePayload(); } catch (_) { /* ignore cache failure */ }
}

export function saveProblem() {
  const payload = state.getCurrentPayload();
  if (!payload) return;
  if (!Array.isArray(payload.problems)) payload.problems = [];
  const form = getProblemForm();
  if (!validateProblemForm(form)) return;
  const deleteBtn = getProblemEditor()?.querySelector('[data-action="delete-problem"]');
  const editingId = deleteBtn?.dataset?.id || null;
  const statusSelect = document.getElementById("problem-status");
  const status = statusSelect ? statusSelect.value : "Active";
  const now = new Date().toISOString();
  if (editingId) {
    const idx = payload.problems.findIndex(p => p.id === editingId);
    if (idx !== -1) {
      payload.problems[idx] = { ...payload.problems[idx], title: form.title, body: form.body, priority: form.priority, status, updatedAt: now };
    }
  } else {
    payload.problems.push({ id: `prob-${Date.now()}`, ...form, status, createdAt: now });
  }
  state.setCurrentPayload(payload);
  hideProblemEditor();
  renderProblemsPage(payload);
  try { if (typeof state.cachePayload === "function") state.cachePayload(); } catch (_) { /* ignore cache failure */ }
}

export function deleteProblem(id) {
  const payload = state.getCurrentPayload();
  if (!payload) return;
  if (!confirm("Delete this problem? This cannot be undone.")) return;
  payload.problems = (payload.problems || []).filter(p => p.id !== id);
  state.setCurrentPayload(payload);
  const editor = getProblemEditor();
  const deleteBtn = editor?.querySelector('[data-action="delete-problem"]');
  if (deleteBtn?.dataset?.id === id) hideProblemEditor();
  renderProblemsPage(payload);
  try { if (typeof state.cachePayload === "function") state.cachePayload(); } catch (_) { /* ignore cache failure */ }
}