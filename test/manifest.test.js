const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { read, root } = require("./helpers");

const manifest = JSON.parse(read("manifest.json"));

test("every file the manifest references exists", () => {
  const files = [
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
    ...manifest.content_scripts.flatMap((cs) => [...(cs.css || []), ...(cs.js || [])]),
  ];
  for (const f of files) assert.ok(fs.existsSync(path.join(root, f)), f);
});

test("each content script loads settings.js first", () => {
  for (const cs of manifest.content_scripts) assert.equal(cs.js[0], "settings.js");
});

test("every setting has a popup switch and every switch a setting", () => {
  const keys = [...read("popup/popup.html").matchAll(/data-key="(\w+)"/g)].map((m) => m[1]);
  const defaults = Object.keys(
    new Function(`${read("settings.js")}; return RSB_DEFAULTS;`)()
  );
  assert.deepEqual(keys.sort(), defaults.sort());
});
