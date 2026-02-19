const STORAGE_KEY = "hyuckjin-portfolio-data";
const DATA_URL = "data/portfolio.json";
const ADMIN_PASSWORD = "HJPORT";
const AUTH_KEY = "hj-admin-session";

const SECTION_KEYS = ["news", "education", "publications", "conferenceProceedings", "honors"];

let dataState = {};
let activePanel = "overview";

const sectionConfig = {
  news: [
    { key: "date", label: "Date", required: true, type: "text", placeholder: "2026-02-15" },
    { key: "title", label: "Title", required: true, type: "text", placeholder: "News title" },
    { key: "body", label: "Body", required: true, type: "textarea", placeholder: "News summary" }
  ],
  education: [
    { key: "period", label: "Period", required: true, type: "text", placeholder: "Mar.2023 -" },
    { key: "degree", label: "Degree", required: true, type: "text", placeholder: "Ph.D. Candidate" },
    { key: "institution", label: "Institution", required: true, type: "text", placeholder: "KAIST" },
    { key: "notes", label: "Notes", required: false, type: "textarea", placeholder: "Advisor, lab, location" }
  ],
  publications: [
    { key: "year", label: "Year", required: true, type: "text", placeholder: "2026" },
    { key: "title", label: "Title", required: true, type: "text", placeholder: "Paper title" },
    { key: "image", label: "Highlight Image URL/Path", required: false, type: "text", placeholder: "assets/pub1.jpg or https://..." },
    { key: "citation", label: "Citation (free layout)", required: false, type: "textarea", placeholder: "Optional custom citation text. Line breaks are supported." },
    { key: "authors", label: "Authors", required: true, type: "text", placeholder: "Author list" },
    { key: "venue", label: "Venue", required: true, type: "text", placeholder: "Journal / conference" },
    { key: "details", label: "Details", required: false, type: "textarea", placeholder: "Pages / notes" },
    { key: "link", label: "Link", required: false, type: "text", placeholder: "https://..." }
  ],
  conferenceProceedings: [
    { key: "year", label: "Year", required: false, type: "text", placeholder: "2026" },
    { key: "month", label: "Month", required: false, type: "text", placeholder: "Jan" },
    { key: "title", label: "Title", required: true, type: "text", placeholder: "Talk title" },
    { key: "image", label: "Image URL/Path", required: false, type: "text", placeholder: "assets/conf1.jpg or https://..." },
    { key: "citation", label: "Citation (free layout)", required: false, type: "textarea", placeholder: "Optional custom citation text. Line breaks are supported." },
    { key: "authors", label: "Authors", required: true, type: "text", placeholder: "Author list" },
    { key: "venue", label: "Venue", required: true, type: "text", placeholder: "Conference name" },
    { key: "notes", label: "Notes", required: false, type: "textarea", placeholder: "Award / remarks" },
    { key: "link", label: "Link", required: false, type: "text", placeholder: "https://..." }
  ],
  honors: [
    { key: "year", label: "Year", required: true, type: "text", placeholder: "2025" },
    { key: "title", label: "Title", required: true, type: "text", placeholder: "Award title" },
    { key: "organization", label: "Organization", required: false, type: "text", placeholder: "KAIST" },
    { key: "details", label: "Details", required: false, type: "textarea", placeholder: "Additional notes" }
  ]
};

const sectionDefault = {
  news: { id: "", date: "", title: "", body: "" },
  education: { id: "", period: "", degree: "", institution: "", notes: "" },
  publications: { id: "", year: "", title: "", image: "", citation: "", authors: "", venue: "", details: "", link: "" },
  conferenceProceedings: { id: "", year: "", month: "", title: "", image: "", citation: "", authors: "", venue: "", notes: "", link: "" },
  honors: { id: "", year: "", title: "", organization: "", details: "" }
};

const editors = {
  news: document.getElementById("news-editor"),
  education: document.getElementById("education-editor"),
  publications: document.getElementById("publications-editor"),
  conferenceProceedings: document.getElementById("conferenceProceedings-editor"),
  honors: document.getElementById("honors-editor")
};

const authForm = document.getElementById("authForm");
const authOverlay = document.getElementById("authOverlay");
const authError = document.getElementById("authError");
const passwordInput = document.getElementById("adminPassword");
const statusLine = document.getElementById("statusLine");
const jsonInput = document.getElementById("jsonInput");

function fallbackData() {
  return {
    profile: {
      name: "Hyuckjin Jang",
      affiliation: "Graduate School of Culture Technology, KAIST",
      intro: "",
      areaOfInterest: [],
      email: "hyuckjin.jang@kaist.ac.kr",
      photo: "assets/profile.JPG",
      links: {
        cv: "CV_Hyuckjin%20Jang%20(11).pdf",
        orcid: "",
        linkedin: "",
        scholar: ""
      }
    },
    news: [],
    education: [],
    publications: [],
    conferenceProceedings: [],
    honors: []
  };
}

function ensureShape(payload) {
  const data = payload && typeof payload === "object" ? payload : fallbackData();
  data.profile = data.profile || {};
  data.profile.links = data.profile.links || {};
  if (!Array.isArray(data.profile.areaOfInterest)) data.profile.areaOfInterest = [];
  SECTION_KEYS.forEach((key) => {
    if (!Array.isArray(data[key])) data[key] = [];
  });
  return data;
}

function isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.profile || typeof payload.profile !== "object") return false;
  if (!payload.profile.links || typeof payload.profile.links !== "object") return false;
  if (!Array.isArray(payload.profile.areaOfInterest)) return false;
  return SECTION_KEYS.every((key) => Array.isArray(payload[key]));
}

function randomId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function parseYear(value) {
  const matched = String(value || "").match(/\d{4}/);
  return matched ? Number(matched[0]) : 0;
}

function setStatus(text) {
  statusLine.textContent = text;
}

async function loadFromServer() {
  const response = await fetch(DATA_URL, { cache: "no-cache" });
  if (!response.ok) throw new Error("failed to fetch");
  return await response.json();
}

function fillProfileInputs() {
  const p = dataState.profile || {};
  const links = p.links || {};
  document.getElementById("profileName").value = p.name || "";
  document.getElementById("profileAffiliation").value = p.affiliation || "";
  document.getElementById("profileIntro").value = p.intro || "";
  document.getElementById("profileArea").value = Array.isArray(p.areaOfInterest) ? p.areaOfInterest.join(", ") : "";
  document.getElementById("profileEmail").value = p.email || "";
  document.getElementById("profilePhoto").value = p.photo || "assets/profile.JPG";
  document.getElementById("linkCv").value = links.cv || "";
  document.getElementById("linkOrcid").value = links.orcid || "";
  document.getElementById("linkLinkedin").value = links.linkedin || "";
  document.getElementById("linkScholar").value = links.scholar || "";
}

function readProfileInputs() {
  const areaRaw = document.getElementById("profileArea").value;
  return {
    name: document.getElementById("profileName").value.trim(),
    affiliation: document.getElementById("profileAffiliation").value.trim(),
    intro: document.getElementById("profileIntro").value.trim(),
    areaOfInterest: areaRaw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
    email: document.getElementById("profileEmail").value.trim(),
    photo: document.getElementById("profilePhoto").value.trim() || "assets/profile.JPG",
    links: {
      cv: document.getElementById("linkCv").value.trim(),
      orcid: document.getElementById("linkOrcid").value.trim(),
      linkedin: document.getElementById("linkLinkedin").value.trim(),
      scholar: document.getElementById("linkScholar").value.trim()
    }
  };
}

function createRow(section, item, index) {
  const wrapper = document.createElement("div");
  wrapper.className = "admin-entry";
  wrapper.dataset.section = section;
  wrapper.dataset.index = String(index);

  sectionConfig[section].forEach((field) => {
    const row = document.createElement("div");
    row.className = "field";

    const id = `${section}-${field.key}-${index}`;
    const label = document.createElement("label");
    label.htmlFor = id;
    label.textContent = `${field.label}${field.required ? " *" : ""}`;

    const input = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
    input.id = id;
    input.className = "editor-field";
    input.dataset.field = field.key;
    input.placeholder = field.placeholder || "";
    input.required = Boolean(field.required);
    input.value = item[field.key] || "";
    if (field.type !== "textarea") input.type = "text";

    row.append(label, input);
    wrapper.appendChild(row);
  });

  const move = document.createElement("div");
  move.className = "move-buttons";
  move.innerHTML = `
    <button type="button" data-action="moveUp" data-section="${section}" data-index="${index}">↑</button>
    <button type="button" data-action="moveDown" data-section="${section}" data-index="${index}">↓</button>
  `;
  wrapper.appendChild(move);

  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "delete-btn";
  remove.dataset.action = "remove";
  remove.dataset.section = section;
  remove.dataset.index = String(index);
  remove.textContent = "Delete";
  wrapper.appendChild(remove);

  return wrapper;
}

function renderSection(section) {
  const root = editors[section];
  if (!root) return;
  root.innerHTML = "";

  const rows = dataState[section] || [];
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "fallback";
    empty.textContent = "No items yet. Add one.";
    root.appendChild(empty);
    return;
  }

  rows.forEach((item, index) => root.appendChild(createRow(section, item, index)));
}

function computeLatestYear() {
  const years = [];
  [
    ...(dataState.publications || []).map((v) => v.year),
    ...(dataState.conferenceProceedings || []).map((v) => v.year),
    ...(dataState.honors || []).map((v) => v.year)
  ].forEach((y) => {
    const parsed = parseYear(y);
    if (parsed) years.push(parsed);
  });

  if (!years.length) return "-";
  return String(Math.max(...years));
}

function updateKpis() {
  const total = SECTION_KEYS.reduce((acc, key) => acc + (Array.isArray(dataState[key]) ? dataState[key].length : 0), 0);
  document.getElementById("kpiTotalItems").textContent = String(total);
  document.getElementById("kpiPublications").textContent = String((dataState.publications || []).length);
  document.getElementById("kpiLatestYear").textContent = computeLatestYear();
}

function renderAll() {
  fillProfileInputs();
  SECTION_KEYS.forEach((key) => renderSection(key));
  updateKpis();
}

function syncFromEditors() {
  dataState.profile = readProfileInputs();

  SECTION_KEYS.forEach((section) => {
    const root = editors[section];
    if (!root) return;

    const entries = Array.from(root.querySelectorAll(".admin-entry"));
    const next = [];

    entries.forEach((entry) => {
      const index = Number(entry.dataset.index);
      const base = dataState[section]?.[index] || { ...sectionDefault[section], id: randomId(section) };

      sectionConfig[section].forEach((field) => {
        const input = entry.querySelector(`[data-field="${field.key}"]`);
        if (input) base[field.key] = input.value.trim();
      });

      if (!base.id) base.id = randomId(section);
      next.push(base);
    });

    dataState[section] = next;
  });

  updateKpis();
}

function saveToStorage() {
  syncFromEditors();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataState));
  setStatus(`Saved at ${new Date().toLocaleTimeString()}.`);
}

function addItem(section) {
  const item = { ...sectionDefault[section], id: randomId(section) };
  dataState[section] = [...(dataState[section] || []), item];
  renderSection(section);
  updateKpis();
}

function moveItem(section, index, delta) {
  const rows = dataState[section];
  if (!Array.isArray(rows)) return;

  const next = index + delta;
  if (next < 0 || next >= rows.length) return;

  [rows[index], rows[next]] = [rows[next], rows[index]];
  renderSection(section);
}

function removeItem(section, index) {
  const rows = dataState[section];
  if (!Array.isArray(rows)) return;
  if (index < 0 || index >= rows.length) return;

  rows.splice(index, 1);
  renderSection(section);
  updateKpis();
}

function exportJson() {
  syncFromEditors();
  const blob = new Blob([JSON.stringify(dataState, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "portfolio.json";
  a.click();
  URL.revokeObjectURL(url);
  setStatus("Export completed.");
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(String(event.target.result));
      if (!isValidPayload(parsed)) throw new Error("schema mismatch");
      dataState = ensureShape(parsed);
      renderAll();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataState));
      setStatus("Imported and saved.");
    } catch {
      setStatus("Import failed: invalid JSON schema.");
    }
  };
  reader.readAsText(file);
}

function setActivePanel(panel) {
  activePanel = panel;

  document.querySelectorAll(".admin-nav-item[data-panel]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.panel === panel);
  });

  document.querySelectorAll(".admin-panel").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.panelContent === panel);
  });
}

function bindEvents() {
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches(".admin-nav-item[data-panel]")) {
      setActivePanel(target.dataset.panel || "overview");
      return;
    }

    if (!(target instanceof HTMLButtonElement)) return;
    const action = target.dataset.action;
    if (!action) return;

    const section = target.dataset.section;
    const index = Number(target.dataset.index);

    if (action === "add") return addItem(section);
    if (action === "moveUp") return moveItem(section, index, -1);
    if (action === "moveDown") return moveItem(section, index, 1);
    if (action === "remove") {
      if (window.confirm("Delete this item?")) removeItem(section, index);
    }
  });

  document.getElementById("saveBtn").addEventListener("click", saveToStorage);

  document.getElementById("previewBtn").addEventListener("click", (event) => {
    event.preventDefault();
    syncFromEditors();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataState));
    window.open("index.html", "_blank", "noopener");
  });

  document.getElementById("exportBtn").addEventListener("click", (event) => {
    event.preventDefault();
    exportJson();
  });

  document.getElementById("importBtn").addEventListener("click", (event) => {
    event.preventDefault();
    jsonInput.click();
  });

  jsonInput.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) importJson(file);
    event.target.value = "";
  });

  document.getElementById("resetBtn").addEventListener("click", async (event) => {
    event.preventDefault();
    if (!window.confirm("Load sample data from portfolio.json and discard browser edits?")) return;

    try {
      const server = await loadFromServer();
      dataState = ensureShape(server);
      renderAll();
      saveToStorage();
      setStatus("Reset from sample completed.");
    } catch {
      dataState = ensureShape(fallbackData());
      renderAll();
      saveToStorage();
      setStatus("Sample load failed. Reset to fallback data.");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(AUTH_KEY);
    authOverlay.classList.remove("admin-hidden");
    setStatus("Logged out.");
  });

  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const normalized = passwordInput.value.replace(/\s+/g, "").toUpperCase();
    if (normalized !== ADMIN_PASSWORD.toUpperCase()) {
      authError.textContent = "Wrong password.";
      passwordInput.select();
      return;
    }

    sessionStorage.setItem(AUTH_KEY, "true");
    authError.textContent = "";
    authOverlay.classList.add("admin-hidden");
    hydrateState();
  });
}

async function hydrateState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (isValidPayload(parsed)) {
        dataState = ensureShape(parsed);
        renderAll();
        setActivePanel(activePanel);
        return;
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    const server = await loadFromServer();
    dataState = ensureShape(server);
  } catch {
    dataState = ensureShape(fallbackData());
    setStatus("Could not fetch data file. Loaded fallback.");
  }

  renderAll();
  setActivePanel(activePanel);
}

bindEvents();
if (sessionStorage.getItem(AUTH_KEY) === "true") {
  authOverlay.classList.add("admin-hidden");
  hydrateState();
}
