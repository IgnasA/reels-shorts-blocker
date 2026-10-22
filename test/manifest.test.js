// Store-readiness checks on the manifest and the shipped files.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { EXTENSION_FILES } = require("../scripts/package.js");
const { read } = require("./helpers");

const ROOT = path.join(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "manifest.json"), "utf8"));

function shippedFiles(rel = "") {
  const entries = rel ? fs.readdirSync(path.join(ROOT, rel)) : EXTENSION_FILES;
  return entries.flatMap((name) => {
    const p = path.join(rel, name);
    return fs.statSync(path.join(ROOT, p)).isDirectory() ? shippedFiles(p) : [p];
  });
}

function pngSize(file) {
  const buf = fs.readFileSync(path.join(ROOT, file));
  assert.equal(buf.toString("ascii", 1, 4), "PNG", `${file} is not a PNG`);
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

test("manifest is Manifest V3 with the fields the store requires", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.ok(manifest.name && manifest.name.length <= 75, "name is required, max 75 chars");
  assert.ok(manifest.description && manifest.description.length <= 132, "description is required, max 132 chars");
  assert.match(manifest.version, /^\d+(\.\d+){0,3}$/);
});

test("permissions are minimal", () => {
  assert.deepEqual(manifest.permissions, ["storage"]);
  assert.equal(manifest.host_permissions, undefined);
  assert.equal(manifest.optional_permissions, undefined);
  assert.equal(manifest.background, undefined, "no background worker is needed");
  assert.equal(manifest.web_accessible_resources, undefined);
  assert.equal(manifest.externally_connectable, undefined);
  for (const cs of manifest.content_scripts) {
    for (const m of cs.matches) assert.match(m, /^https:\/\/\*\.(youtube|facebook|instagram)\.com\/\*$/, m);
  }
});

test("icons exist at the declared sizes", () => {
  const all = { ...manifest.icons, ...manifest.action.default_icon };
  assert.ok(manifest.icons["128"], "a 128px icon is required by the store");
  for (const [size, file] of Object.entries(all)) {
    assert.deepEqual(pngSize(file), [Number(size), Number(size)], file);
  }
});

test("every file the manifest references ships", () => {
  const shipped = new Set(shippedFiles());
  const refs = [
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
    manifest.action.default_popup,
    ...manifest.content_scripts.flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
  ];
  for (const ref of refs) assert.ok(shipped.has(path.normalize(ref)), `${ref} is missing from the package`);
});

test("the popup only loads local scripts and styles", () => {
  const html = fs.readFileSync(path.join(ROOT, manifest.action.default_popup), "utf8");
  for (const [, src] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.doesNotMatch(src, /^(https?:)?\/\//, `remote resource ${src}`);
    assert.ok(fs.existsSync(path.join(ROOT, "popup", src)), `${src} does not exist`);
  }
});

test("shipped scripts parse and contain no remote or dynamic code", () => {
  for (const file of shippedFiles().filter((f) => /\.(js|css|html)$/.test(f))) {
    const src = fs.readFileSync(path.join(ROOT, file), "utf8");
    if (file.endsWith(".js")) new vm.Script(src, { filename: file });
    assert.doesNotMatch(src, /\beval\s*\(|new\s+Function\s*\(|importScripts\s*\(|\bimport\s*\(/, `${file}: dynamic code`);
    assert.doesNotMatch(src, /https?:\/\/(?!www\.w3\.org\/)/, `${file}: remote URL`);
    assert.doesNotMatch(src, /\.innerHTML\s*=|insertAdjacentHTML|document\.write/, `${file}: HTML injection`);
  }
});

test("no file or folder name starts with an underscore (Chrome refuses to load those)", () => {
  for (const f of shippedFiles()) {
    for (const part of f.split(path.sep)) assert.ok(!part.startsWith("_"), f);
  }
});

test("minimum Chrome version covers the features the extension relies on", () => {
  // CSS :has() (youtube.css) shipped in Chrome 105; the Navigation API in 102.
  assert.ok(Number(manifest.minimum_chrome_version) >= 105);
});

test("each content script loads settings.js and urls.js first", () => {
  for (const cs of manifest.content_scripts) assert.deepEqual(cs.js.slice(0, 2), ["settings.js", "urls.js"]);
});

test("every setting has a popup switch and every switch a setting", () => {
  const keys = [...read("popup/popup.html").matchAll(/data-key="(\w+)"/g)].map((m) => m[1]);
  const defaults = Object.keys(vm.runInNewContext(`${read("settings.js")}; RSB_DEFAULTS`));
  assert.deepEqual(keys.sort(), defaults.sort());
});
