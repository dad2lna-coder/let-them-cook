export const SCHEMA_VERSION = "4.0.0";

export const EMPTY_PAYLOAD = {
  version: 1,
  updatedAt: null,
  updatedBy: null,
  items: [],
  sharedNotes: "",
  meta: { app: "Let Them Cook" },
  schema: "let-them-cook-dashboard",
  schemaVersion: SCHEMA_VERSION,
  exportedAt: null,
  exportedBy: null,
  source: "LetThemCook.exe",
  intendedFolderDisplayName: "OneDrive - USTSA\\FACTTT",
  problems: [],
  initiatives: []
};

export function isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.schema !== "let-them-cook-dashboard") return false;
  if (!Array.isArray(payload.initiatives)) return false;
  if (!Array.isArray(payload.problems)) return false;
  for (const init of payload.initiatives) {
    if (!init.id || typeof init.id !== "string") return false;
    if (!init.name || typeof init.name !== "string") return false;
    if (init.status && !["New", "Planning", "Active", "Completed"].includes(init.status)) return false;
    if (init.problemId !== undefined && init.problemId !== null && typeof init.problemId !== "string") return false;
    if (!Array.isArray(init.sections)) return false;
    for (const sec of init.sections) {
      if (!sec.id || typeof sec.id !== "string") return false;
      if (!sec.name || typeof sec.name !== "string") return false;
      if (!Array.isArray(sec.ideas)) return false;
      if (!Array.isArray(sec.actions)) return false;
      if (!Array.isArray(sec.questions)) return false;
    }
    if (!Array.isArray(init.briefing)) init.briefing = [];
  }
  return true;
}

export function buildDemoStarterPayload() {
  const now = new Date().toISOString();
  return {
    ...EMPTY_PAYLOAD,
    updatedAt: now,
    exportedAt: now,
    exportedBy: "browser-preview",
    source: "LetThemCook-Pages",
    problems: [
      {
        id: "prob-demo-1",
        title: "Notification gaps when personnel leave the operation",
        body: "Scheduling, Payroll, CC, TSMs, Finance, Training, and Senior Management often don't receive timely notice when someone goes on NDO, Training, or TSST-Travel. Manual email forwards are unreliable.",
        priority: "medium",
        status: "Active",
        createdAt: now
      }
    ],
    initiatives: [
      {
        id: "init-demo-1",
        name: "Standardize Movement Notification Fields",
        status: "Active",
        startDate: "2026-09-01",
        problemId: "prob-demo-1",
        briefing: [],
        notes: [
          {
            id: "note-1",
            body: "Kickoff meeting scheduled with Scheduling and Payroll leads for 09/15.",
            createdAt: now,
            author: "Demo Owner",
            parentId: null,
            replies: []
          }
        ],
        sections: [
          {
            id: "init-demo-1-sec-1",
            type: "discovery",
            name: "Discovery",
            notes: [],
            ideas: [
              {
                id: "idea-1",
                idea: "Confirm required recipients for NDO, Training, and TSST notifications",
                contributor: "Demo",
                prosAndConcerns: "Requires cross-team coordination",
                feedback: 2,
                deleted: false
              },
              {
                id: "idea-2",
                idea: "Create a unified notification template with required fields",
                contributor: "Demo",
                prosAndConcerns: "Simplifies automation but needs buy-in",
                feedback: 3,
                deleted: false
              }
            ],
            actions: [
              { id: "task-1", text: "Map current recipients for NDO Movement", complete: true },
              { id: "task-2", text: "Map current recipients for Training Movement", complete: false },
              { id: "task-3", text: "Map current recipients for TSST-Travel", complete: false },
              { id: "task-4", text: "Define standard fields for all movement types", complete: false }
            ],
            questions: [
              "Who owns the distribution list for each movement type?",
              "What is the minimum advance notice required by Payroll?"
            ],
            flow: null
          },
          {
            id: "init-demo-1-sec-2",
            type: "design",
            name: "Design",
            notes: [],
            ideas: [],
            actions: [{ id: "task-5", text: "Prototype intake form", complete: false }],
            questions: ["Should we use a Microsoft Form or Power Automate for intake?"],
            flow: null
          }
        ]
      },
      {
        id: "init-demo-2",
        name: "Automate Notification Distribution",
        status: "Planning",
        startDate: "",
        problemId: "prob-demo-1",
        briefing: [],
        notes: [],
        sections: [
          {
            id: "init-demo-2-sec-1",
            type: "discovery",
            name: "Discovery",
            notes: [],
            ideas: [
              {
                id: "idea-3",
                idea: "Use Power Automate to route notifications from shared mailbox to Teams channels",
                contributor: "Demo",
                prosAndConcerns: "Reduces manual forwarding; needs shared mailbox setup",
                feedback: 1,
                deleted: false
              }
            ],
            actions: [
              { id: "task-6", text: "Inventory existing Teams channels", complete: false },
              { id: "task-7", text: "Test Power Automate flow with shared mailbox", complete: false }
            ],
            questions: ["What Teams channels exist for each target team?"],
            flow: null
          }
        ]
      }
    ]
  };
}