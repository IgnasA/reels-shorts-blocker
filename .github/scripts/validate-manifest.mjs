// Validates manifest.json: parseable, MV3 required fields, and that every
// file it references exists. No dependencies.
import { existsSync, readFileSync } from "node:fs";

const errors = [];
const fail = (msg) => errors.push(msg);

let m;
try {
  m = JSON.parse(readFileSync("manifest.json", "utf8"));
} catch (e) {
  console.error(`manifest.json is not valid JSON: ${e.message}`);
  process.exit(1);
}

if (m.manifest_version !== 3) fail("manifest_version must be 3");
for (const key of ["name", "version"]) {
  if (typeof m[key] !== "string" || !m[key]) fail(`"${key}" must be a non-empty string`);
}
if (typeof m.version === "string" && !/^\d+(\.\d+){0,3}$/.test(m.version)) {
  fail(`"version" must be 1-4 dot-separated integers, got "${m.version}"`);
}
if (typeof m.name === "string" && m.name.length > 75) fail('"name" is over 75 characters');
if (typeof m.description === "string" && m.description.length > 132) {
  fail('"description" is over 132 characters');
}
if (!m.description) fail('"description" is required for store listing');
if (m.background?.scripts && !m.background.service_worker) {
  // Chrome MV3 uses background.service_worker
  fail("background.scripts is not supported in Chrome MV3; use service_worker");
}

const files = [];
for (const f of Object.values(m.icons ?? {})) files.push(f);
if (!m.icons) fail('"icons" is missing');
if (m.action?.default_popup) files.push(m.action.default_popup);
const ai = m.action?.default_icon;
if (typeof ai === "string") files.push(ai);
else if (ai) files.push(...Object.values(ai));
if (m.background?.service_worker) files.push(m.background.service_worker);
for (const cs of m.content_scripts ?? []) {
  if (!Array.isArray(cs.matches) || cs.matches.length === 0) fail("content_script without matches");
  files.push(...(cs.js ?? []), ...(cs.css ?? []));
}
for (const f of files) {
  if (!existsSync(f)) fail(`referenced file not found: ${f}`);
}

if (errors.length) {
  for (const e of errors) console.error(`manifest error: ${e}`);
  process.exit(1);
}
console.log(`manifest.json OK (${m.name} ${m.version}, ${files.length} referenced files)`);
