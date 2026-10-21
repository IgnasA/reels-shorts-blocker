// Runs settings.js plus a content script in a jsdom page with a fake
// chrome.storage and a fake `location`, so redirects can be observed.
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function load({ url, html = "", script, exports = [], stored = {}, session = {} }) {
  const dom = new JSDOM(`<!doctype html><html><body>${html}</body></html>`, {
    url,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  for (const [k, v] of Object.entries(session)) window.sessionStorage.setItem(k, v);

  const listeners = [];
  window.chrome = {
    storage: {
      sync: { get: (defaults, cb) => cb({ ...defaults, ...stored }) },
      onChanged: { addListener: (fn) => listeners.push(fn) },
    },
  };

  const current = new URL(url);
  const redirects = [];
  window.__fakeLocation = {
    get href() {
      return current.href;
    },
    get pathname() {
      return current.pathname;
    },
    replace: (to) => redirects.push(to),
    assign: (to) => redirects.push(to),
  };

  window.eval(
    `(function (location) {\n${read("settings.js")}\n${read(script)}\n` +
      `window.__rsb = { ${exports.join(", ")} };\n})(window.__fakeLocation);`
  );

  return {
    window,
    document: window.document,
    api: window.__rsb,
    redirects,
    // Simulates a change made from the popup.
    setStored(next) {
      Object.assign(stored, next);
      for (const fn of listeners) fn({}, "sync");
    },
  };
}

module.exports = { load, read, root };
