const STORAGE_KEY = "hyuckjin-portfolio-data";
const DATA_URL = "data/portfolio.json";
const REQUIRED_ARRAY_KEYS = ["news", "education", "publications", "conferenceProceedings", "honors"];
let menuBound = false;

function getFallbackData() {
  return {
    profile: {
      name: "Hyuckjin Jang",
      affiliation: "Graduate School of Culture Technology, KAIST",
      intro: "Human-Computer Interaction researcher focused on Extended Reality, sensory substitution, assistive technology, and cognitive neuroscience.",
      areaOfInterest: ["Human-Computer Interaction", "Extended Reality"],
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

function hasRequiredShape(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!payload.profile || typeof payload.profile !== "object") return false;
  if (!payload.profile.links || typeof payload.profile.links !== "object") return false;
  if (!Array.isArray(payload.profile.areaOfInterest)) return false;
  return REQUIRED_ARRAY_KEYS.every((key) => Array.isArray(payload[key]));
}

function normalize(payload) {
  const data = payload && typeof payload === "object" ? payload : getFallbackData();
  data.profile = data.profile || {};
  data.profile.links = data.profile.links || {};
  if (!Array.isArray(data.profile.areaOfInterest)) data.profile.areaOfInterest = [];
  REQUIRED_ARRAY_KEYS.forEach((key) => {
    if (!Array.isArray(data[key])) data[key] = [];
  });
  return data;
}

async function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (hasRequiredShape(parsed)) return normalize(parsed);
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  try {
    const response = await fetch(DATA_URL, { cache: "no-cache" });
    if (response.ok) {
      const parsed = await response.json();
      return normalize(parsed);
    }
  } catch {
    return normalize(getFallbackData());
  }

  return normalize(getFallbackData());
}

function safeText(value, fallback = "Not provided") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeLink(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("mailto:")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return raw;
}

function parseYear(value) {
  const matched = String(value || "").match(/\d{4}/);
  return matched ? Number(matched[0]) : 0;
}

function sortByYearDesc(items, key) {
  return [...items].sort((a, b) => parseYear(b[key]) - parseYear(a[key]));
}

function sortNews(items) {
  return [...items].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

function monthOrder(month) {
  const m = String(month || "").slice(0, 3).toLowerCase();
  const map = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
  return map[m] || 0;
}

function sortConference(items) {
  return [...items].sort((a, b) => {
    const yearDiff = parseYear(b.year) - parseYear(a.year);
    if (yearDiff !== 0) return yearDiff;
    return monthOrder(b.month) - monthOrder(a.month);
  });
}

function formatNewsDate(value) {
  if (!value) return "Date TBD";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(parsed);
}

function formatConferenceDate(month, year) {
  const cleanMonth = String(month || "").trim();
  const cleanYear = String(year || "").trim();
  if (cleanMonth && cleanYear) return `${cleanMonth} ${cleanYear}`;
  if (cleanYear) return cleanYear;
  if (cleanMonth) return cleanMonth;
  return "Date TBD";
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function clearAndGet(id) {
  const node = document.getElementById(id);
  node.innerHTML = "";
  return node;
}

function appendFallback(container, text) {
  container.appendChild(make("p", "fallback", text));
}

function createCardImage(image, altText) {
  const raw = String(image || "").trim();
  if (!raw) return null;
  const wrapper = make("div", "card-media");
  const img = document.createElement("img");
  img.src = raw;
  img.alt = altText;
  img.loading = "lazy";
  wrapper.appendChild(img);
  return wrapper;
}

function bindMenu() {
  if (menuBound) return;
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("siteNav");

  if (!toggle || !nav) return;
  menuBound = true;

  const closeMenu = () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };

  toggle.addEventListener("click", () => {
    const opened = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(opened));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node)) return;
    if (!nav.contains(event.target) && !toggle.contains(event.target)) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });
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
  photo.src = safeText(profile.photo, "assets/profile.JPG");
  photo.onerror = () => {
    photo.src = "assets/profile.JPG";
  };

  const areaRoot = clearAndGet("area-list");
  const areas = Array.isArray(profile.areaOfInterest) ? profile.areaOfInterest : [];
  if (!areas.length) {
    areaRoot.appendChild(make("span", "chip", "Area of Interest not set"));
  } else {
    areas.forEach((area) => areaRoot.appendChild(make("span", "chip", safeText(area))));
  }

  const linkRoot = clearAndGet("profile-links");
  const defs = [
    ["CV", profile.links.cv],
    ["ORCID", profile.links.orcid],
    ["LinkedIn", profile.links.linkedin],
    ["Google Scholar", profile.links.scholar]
  ];

  defs.forEach(([label, href]) => {
    const link = normalizeLink(href);
    const node = document.createElement(link ? "a" : "span");
    node.className = link ? "social-link" : "social-link disabled";
    node.textContent = label;
    if (link) {
      node.href = link;
      node.target = "_blank";
      node.rel = "noreferrer";
    }
    linkRoot.appendChild(node);
  });
}

function renderNews(items) {
  const root = clearAndGet("news-list");
  const rows = sortNews(items);
  if (!rows.length) return appendFallback(root, "No news entries yet.");

  rows.forEach((item) => {
    const card = make("article", "news-item");
    const time = make("time", "", formatNewsDate(item.date));
    if (item.date) time.dateTime = item.date;

    const body = make("div", "news-content");
    body.appendChild(make("h3", "", safeText(item.title)));
    body.appendChild(make("p", "", safeText(item.body, "")));

    card.append(time, body);
    root.appendChild(card);
  });
}

function renderEducation(items) {
  const root = clearAndGet("education-list");
  const rows = sortByYearDesc(items, "period");
  if (!rows.length) return appendFallback(root, "No education entries yet.");

  rows.forEach((item) => {
    const li = make("li", "list-item");
    li.appendChild(make("span", "stack-title", `${safeText(item.degree)} / ${safeText(item.period)}`));
    li.appendChild(make("span", "stack-sub", safeText(item.institution, "")));
    li.appendChild(make("span", "stack-note", safeText(item.notes, "")));
    root.appendChild(li);
  });
}

function renderPublications(items) {
  const root = clearAndGet("publication-list");
  const rows = sortByYearDesc(items, "year");
  if (!rows.length) return appendFallback(root, "No publication entries yet.");

  rows.forEach((item) => {
    const card = make("article", "card-item");
    const media = createCardImage(item.image, item.title || "publication image");
    if (media) card.appendChild(media);

    const top = make("div", "card-top");
    top.appendChild(make("h3", "", safeText(item.title)));
    top.appendChild(make("span", "date-chip", safeText(item.year, "Date TBD")));
    card.appendChild(top);

    const citationRaw = String(item.citation || "").trim();
    if (citationRaw) {
      card.appendChild(make("p", "citation", citationRaw));
    } else {
      const fallbackCitation = [safeText(item.authors, ""), safeText(item.venue, ""), safeText(item.details, "")]
        .filter(Boolean)
        .join("\n");
      if (fallbackCitation) {
        card.appendChild(make("p", "citation", fallbackCitation));
      }
    }

    const link = normalizeLink(item.link);
    if (link) {
      const a = make("a", "card-link", "View");
      a.href = link;
      a.target = "_blank";
      a.rel = "noreferrer";
      card.appendChild(a);
    }

    root.appendChild(card);
  });
}

function renderConferences(items) {
  const root = clearAndGet("conference-list");
  const rows = sortConference(items);
  if (!rows.length) return appendFallback(root, "No conference entries yet.");

  rows.forEach((item) => {
    const card = make("article", "card-item");
    const media = createCardImage(item.image, item.title || "conference image");
    if (media) card.appendChild(media);

    const top = make("div", "card-top");
    top.appendChild(make("h3", "", safeText(item.title)));
    top.appendChild(make("span", "date-chip", formatConferenceDate(item.month, item.year)));
    card.appendChild(top);

    const citationRaw = String(item.citation || "").trim();
    if (citationRaw) {
      card.appendChild(make("p", "citation", citationRaw));
    } else {
      const fallbackCitation = [safeText(item.authors, ""), safeText(item.venue, ""), safeText(item.notes, "")]
        .filter(Boolean)
        .join("\n");
      if (fallbackCitation) {
        card.appendChild(make("p", "citation", fallbackCitation));
      }
    }

    const link = normalizeLink(item.link);
    if (link) {
      const a = make("a", "card-link", "View");
      a.href = link;
      a.target = "_blank";
      a.rel = "noreferrer";
      card.appendChild(a);
    }

    root.appendChild(card);
  });
}

function renderHonors(items) {
  const root = clearAndGet("honor-list");
  const rows = sortByYearDesc(items, "year");
  if (!rows.length) return appendFallback(root, "No honors entries yet.");

  rows.forEach((item) => {
    const li = make("li", "list-item");
    const row = make("div", "honor-row");
    row.appendChild(make("span", "date-chip", safeText(item.year, "Date TBD")));
    row.appendChild(make("span", "stack-title", safeText(item.title)));
    li.appendChild(row);
    li.appendChild(make("span", "stack-sub", safeText(item.organization, "")));
    li.appendChild(make("span", "stack-note", safeText(item.details, "")));
    root.appendChild(li);
  });
}

async function render() {
  bindMenu();
  const data = await loadData();
  renderProfile(data.profile);
  renderNews(data.news);
  renderEducation(data.education);
  renderPublications(data.publications);
  renderConferences(data.conferenceProceedings);
  renderHonors(data.honors);
}

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    render();
  }
});

render();
