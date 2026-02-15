const STORAGE_KEY = "hyuckjin-portfolio-data";
const DATA_URL = "data/portfolio.json";

const ARRAY_KEYS = [
  "news",
  "education",
  "publications",
  "conferenceProceedings",
  "honors",
  "grants",
  "projects",
  "experiences",
  "services",
  "mentorships",
  "skills",
];

async function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (isCompletePayload(parsed)) {
        return normalize(parsed);
      }
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (response.ok) {
      return normalize(await response.json());
    }
  } catch {
    return normalize(getFallbackData());
  }

  return normalize(getFallbackData());
}

function isCompletePayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.profile || typeof payload.profile !== "object") return false;
  if (!payload.profile.links || typeof payload.profile.links !== "object") return false;
  if (!Array.isArray(payload.profile.areaOfInterest)) return false;
  return ARRAY_KEYS.every((key) => Array.isArray(payload[key]));
}

function getFallbackData() {
  return {
    profile: {
      name: "Hyuckjin Jang",
      affiliation: "Graduate School of Culture Technology, KAIST",
      intro: "Human-Computer Interaction researcher in XR, sensory substitution, and assistive technology.",
      areaOfInterest: ["Human-Computer Interaction", "Extended Reality"],
      email: "hyuckjin.jang@kaist.ac.kr",
      photo: "assets/profile.png",
      links: {
        cv: "CV_Hyuckjin%20Jang%20(11).pdf",
        orcid: "",
        linkedin: "",
        scholar: "",
        homepage: "https://bit.ly/4ktJ2ah",
      },
    },
    news: [],
    education: [],
    publications: [],
    conferenceProceedings: [],
    honors: [],
    grants: [],
    projects: [],
    experiences: [],
    services: [],
    mentorships: [],
    skills: [],
  };
}

function normalize(data) {
  const payload = data && typeof data === "object" ? data : getFallbackData();
  payload.profile = payload.profile || {};
  payload.profile.links = payload.profile.links || {};
  if (!Array.isArray(payload.profile.areaOfInterest)) payload.profile.areaOfInterest = [];

  ARRAY_KEYS.forEach((key) => {
    if (!Array.isArray(payload[key])) payload[key] = [];
  });

  return payload;
}

function safeText(value, fallback = "Not provided") {
  const s = String(value || "").trim();
  return s || fallback;
}

function safeLink(value) {
  const s = String(value || "").trim();
  return s || "";
}

function parseYear(value) {
  const match = String(value || "").match(/\d{4}/);
  return match ? Number(match[0]) : 0;
}

function sortByYearDesc(items, field = "year") {
  return [...items].sort((a, b) => parseYear(b[field]) - parseYear(a[field]));
}

function sortNews(items) {
  return [...items].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function monthScore(month) {
  const map = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  return map[String(month || "").slice(0, 3).toLowerCase()] || 0;
}

function sortConferences(items) {
  return [...items].sort((a, b) => {
    const y = parseYear(b.year) - parseYear(a.year);
    if (y !== 0) return y;
    return monthScore(b.month) - monthScore(a.month);
  });
}

function formatDate(value) {
  if (!value) return "Date TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(d);
}

function clearAndGet(id) {
  const node = document.getElementById(id);
  node.innerHTML = "";
  return node;
}

function make(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendFallback(container, text) {
  container.appendChild(make("p", "fallback", text));
}

function renderProfile(profile) {
  document.getElementById("profile-name").textContent = safeText(profile.name, "Hyuckjin Jang");
  document.getElementById("profile-affiliation").textContent = safeText(profile.affiliation, "Affiliation TBD");
  document.getElementById("profile-intro").textContent = safeText(profile.intro, "Profile intro is empty.");

  const email = safeText(profile.email, "contact unavailable");
  const emailNode = document.getElementById("profile-email");
  emailNode.textContent = email;
  emailNode.href = `mailto:${email}`;

  const photo = document.getElementById("profile-photo");
  photo.src = safeText(profile.photo, "assets/profile.png");
  photo.onerror = () => {
    photo.src = "assets/profile.png";
  };

  const areaNode = clearAndGet("area-list");
  const areas = Array.isArray(profile.areaOfInterest) ? profile.areaOfInterest : [];
  if (!areas.length) {
    areaNode.appendChild(make("span", "chip", "Area of Interest not set"));
  } else {
    areas.forEach((area) => {
      areaNode.appendChild(make("span", "chip", safeText(area)));
    });
  }

  const linkNode = clearAndGet("profile-links");
  const linkDefs = [
    ["CV", profile.links.cv],
    ["ORCID", profile.links.orcid],
    ["LinkedIn", profile.links.linkedin],
    ["Google Scholar", profile.links.scholar],
    ["Homepage", profile.links.homepage],
  ];

  linkDefs.forEach(([label, href]) => {
    const url = safeLink(href);
    const node = document.createElement(url ? "a" : "span");
    node.className = url ? "social-link" : "social-link disabled";
    node.textContent = label;
    if (url) {
      node.href = url;
      node.target = "_blank";
      node.rel = "noreferrer";
    }
    linkNode.appendChild(node);
  });
}

function renderNews(items) {
  const root = clearAndGet("news-list");
  const rows = sortNews(items);
  if (!rows.length) return appendFallback(root, "No news entries yet.");

  rows.forEach((item) => {
    const card = make("article", "news-item");
    const time = make("time", "", formatDate(item.date));
    if (item.date) time.dateTime = item.date;
    const body = make("div");
    body.appendChild(make("h3", "", safeText(item.title)));
    body.appendChild(make("p", "", safeText(item.body)));
    card.append(time, body);
    root.appendChild(card);
  });
}

function renderEducation(items) {
  const root = clearAndGet("education-list");
  const rows = sortByYearDesc(items, "period");
  if (!rows.length) return appendFallback(root, "No education entries yet.");

  rows.forEach((item) => {
    const li = make("li");
    li.appendChild(make("span", "stack-title", `${safeText(item.degree)} / ${safeText(item.period)}`));
    li.appendChild(make("span", "stack-sub", safeText(item.institution)));
    li.appendChild(make("span", "stack-note", safeText(item.notes, "")));
    root.appendChild(li);
  });
}

function renderCardSection(rootId, items, config) {
  const root = clearAndGet(rootId);
  if (!items.length) return appendFallback(root, config.empty);

  items.forEach((item) => {
    const card = make("article", "card-item");
    card.appendChild(make("h3", "", safeText(item[config.titleKey])));

    config.metaKeys.forEach((metaKey) => {
      if (!item[metaKey]) return;
      card.appendChild(make("p", "card-meta", safeText(item[metaKey], "")));
    });

    if (config.noteKey && item[config.noteKey]) {
      card.appendChild(make("p", "card-meta", safeText(item[config.noteKey], "")));
    }

    if (config.linkKey && item[config.linkKey]) {
      const a = make("a", "card-link", "View");
      a.href = item[config.linkKey];
      a.target = "_blank";
      a.rel = "noreferrer";
      card.appendChild(a);
    }

    root.appendChild(card);
  });
}

function renderListSection(rootId, items, mapper, emptyText) {
  const root = clearAndGet(rootId);
  if (!items.length) return appendFallback(root, emptyText);

  items.forEach((item) => {
    const li = make("li");
    const mapped = mapper(item);
    li.appendChild(make("span", "stack-title", mapped.title));
    if (mapped.sub) li.appendChild(make("span", "stack-sub", mapped.sub));
    if (mapped.note) li.appendChild(make("span", "stack-note", mapped.note));
    root.appendChild(li);
  });
}

async function render() {
  const data = await loadData();
  renderProfile(data.profile);
  renderNews(data.news);
  renderEducation(data.education);

  renderCardSection("publication-list", sortByYearDesc(data.publications), {
    titleKey: "title",
    metaKeys: ["authors", "venue", "year"],
    noteKey: "details",
    linkKey: "link",
    empty: "No publication entries yet.",
  });

  renderCardSection("conference-list", sortConferences(data.conferenceProceedings), {
    titleKey: "title",
    metaKeys: ["month", "year", "authors", "venue"],
    noteKey: "notes",
    linkKey: "link",
    empty: "No conference entries yet.",
  });

  renderListSection(
    "honor-list",
    sortByYearDesc(data.honors),
    (item) => ({
      title: `${safeText(item.year)} - ${safeText(item.title)}`,
      sub: safeText(item.organization, ""),
      note: safeText(item.details, ""),
    }),
    "No honors entries yet.",
  );

  renderCardSection("grant-list", sortByYearDesc(data.grants, "period"), {
    titleKey: "title",
    metaKeys: ["period", "organization"],
    noteKey: "details",
    linkKey: "",
    empty: "No grant entries yet.",
  });

  renderCardSection("project-list", sortByYearDesc(data.projects, "period"), {
    titleKey: "title",
    metaKeys: ["period", "organization", "role"],
    noteKey: "details",
    linkKey: "",
    empty: "No project entries yet.",
  });

  renderListSection(
    "experience-list",
    sortByYearDesc(data.experiences, "period"),
    (item) => ({
      title: `${safeText(item.period)} - ${safeText(item.role)}`,
      sub: safeText(item.organization),
      note: safeText(item.details, ""),
    }),
    "No experience entries yet.",
  );

  renderListSection(
    "service-list",
    data.services,
    (item) => ({ title: safeText(item.category), sub: safeText(item.details) }),
    "No academic service entries yet.",
  );

  renderListSection(
    "mentoring-list",
    sortByYearDesc(data.mentorships, "period"),
    (item) => ({
      title: `${safeText(item.period)} - ${safeText(item.name)}`,
      sub: safeText(item.level, ""),
      note: safeText(item.details, ""),
    }),
    "No mentoring entries yet.",
  );

  renderListSection(
    "skill-list",
    data.skills,
    (item) => ({ title: safeText(item.category), sub: safeText(item.details) }),
    "No skill entries yet.",
  );
}

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) render();
});

render();
