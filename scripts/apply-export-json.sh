#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_JSON="$ROOT_DIR/data/portfolio.json"
SOURCE_JSON="${1:-}"

if [[ -z "$SOURCE_JSON" ]]; then
  echo "Usage: ./scripts/apply-export-json.sh <path-to-exported-portfolio.json>" >&2
  exit 1
fi

if [[ ! -f "$SOURCE_JSON" ]]; then
  echo "Error: file not found: $SOURCE_JSON" >&2
  exit 1
fi

node - "$SOURCE_JSON" <<'NODE'
const fs = require("fs");

const path = process.argv[2];
let parsed;

try {
  parsed = JSON.parse(fs.readFileSync(path, "utf8"));
} catch (err) {
  console.error(`Error: invalid JSON: ${err.message}`);
  process.exit(1);
}

const requiredArrays = [
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

if (!parsed || typeof parsed !== "object") {
  console.error("Error: JSON root must be an object.");
  process.exit(1);
}

if (!parsed.profile || typeof parsed.profile !== "object") {
  console.error("Error: missing or invalid 'profile'.");
  process.exit(1);
}

if (!parsed.profile.links || typeof parsed.profile.links !== "object") {
  console.error("Error: missing or invalid 'profile.links'.");
  process.exit(1);
}

if (!Array.isArray(parsed.profile.areaOfInterest)) {
  console.error("Error: missing or invalid 'profile.areaOfInterest' (must be array).");
  process.exit(1);
}

for (const key of requiredArrays) {
  if (!Array.isArray(parsed[key])) {
    console.error(`Error: missing or invalid '${key}' (must be array).`);
    process.exit(1);
  }
}

console.log("JSON schema check passed.");
NODE

cp "$SOURCE_JSON" "$TARGET_JSON"
echo "Updated: $TARGET_JSON"
