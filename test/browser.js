// Launches Chromium with the packaged extension loaded and answers every
// request to YouTube/Facebook with a local fixture page, so the real content
// scripts run against known markup without touching the network.
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const { stage } = require("../scripts/package.js");

const FIXTURES = path.join(__dirname, "fixtures");
const extDir = stage(fs.mkdtempSync(path.join(os.tmpdir(), "rsb-ext-")));

// Chrome derives an unpacked extension's ID from its path.
const extId = [...crypto.createHash("sha256").update(extDir).digest("hex").slice(0, 32)]
  .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
  .join("");

function fixtureFor(url) {
  const { hostname } = new URL(url);
  if (/(^|\.)youtube\.com$/.test(hostname)) return hostname.startsWith("m.") ? "youtube-mobile.html" : "youtube.html";
  if (/(^|\.)facebook\.com$/.test(hostname)) return "facebook.html";
  return null;
}

async function launch() {
  const context = await chromium.launchPersistentContext("", {
    headless: true,
    channel: "chromium", // the full browser; the default headless shell can't load extensions
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
  });
  await context.route("**/*", (route) => {
    const req = route.request();
    const fixture = req.resourceType() === "document" && fixtureFor(req.url());
    if (!fixture) return req.url().startsWith("chrome-extension://") ? route.continue() : route.abort();
    return route.fulfill({ contentType: "text/html", body: fs.readFileSync(path.join(FIXTURES, fixture)) });
  });
  return context;
}

// Flips a switch in the real popup, as a user would.
async function setOption(context, key, on) {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extId}/popup/popup.html`);
  const box = popup.locator(`input[data-key="${key}"]`);
  // Wait for the popup to show the stored value before deciding to click.
  await popup.waitForFunction(
    (k) =>
      new Promise((r) =>
        chrome.storage.sync.get(RSB_DEFAULTS, (s) => r(document.querySelector(`input[data-key="${k}"]`).checked === s[k]))
      ),
    key
  );
  if ((await box.isChecked()) !== on) await box.click();
  await popup.waitForFunction(
    ([k, v]) => new Promise((r) => chrome.storage.sync.get(k, (s) => r(s[k] === v))),
    [key, on]
  );
  await popup.close();
}

// Elements marked data-expect="hidden|visible" in the fixture whose
// visibility is wrong, as readable strings (empty means all good).
function wrongVisibility(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("[data-expect]")]
      .filter((el) => (el.getAttribute("data-expect") === "hidden") === el.checkVisibility())
      .map((el) => `${el.dataset.expect === "hidden" ? "visible" : "hidden"}: ${el.dataset.name || el.outerHTML.slice(0, 80)}`)
  );
}

module.exports = { launch, setOption, wrongVisibility, extId };
