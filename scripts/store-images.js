// Renders the Chrome Web Store images into store/:
//   store/screenshots/*.png   1280x800 screenshots of the extension at work
//   store/promo-tile-440x280.png
// The screenshots load the packaged extension into Playwright's Chromium and
// answer youtube.com/facebook.com/instagram.com with the stand-in pages in
// store/src/, so they show the real content scripts on made-up content.
//   npm run store:images
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");
const { stage } = require("./package.js");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "store", "src");
const OUT = path.join(ROOT, "store");
const SHOTS = path.join(OUT, "screenshots");

const dataUrl = (file) => `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// The icon artwork without the 16px of transparent padding the store icon
// (icons/icon128.png) carries, so it fills its box on the images.
const ICON = path.join(SRC, "icon-artwork.png");

const SITES = {
  "www.youtube.com": "youtube.html",
  "www.facebook.com": "facebook.html",
  "www.instagram.com": "instagram.html",
};

async function launch(extDir) {
  const context = await chromium.launchPersistentContext("", {
    headless: true,
    channel: "chromium",
    colorScheme: "light",
    args: [`--disable-extensions-except=${extDir}`, `--load-extension=${extDir}`],
  });
  await context.route("**/*", (route) => {
    const req = route.request();
    if (req.url().startsWith("chrome-extension://")) return route.continue();
    const file = req.resourceType() === "document" && SITES[new URL(req.url()).hostname];
    if (!file) return route.abort();
    return route.fulfill({ contentType: "text/html", body: fs.readFileSync(path.join(SRC, file)) });
  });
  return context;
}

// Writes settings through the extension's own storage, as the popup does.
async function setOptions(context, extId, values) {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extId}/popup/popup.html`);
  await page.evaluate((v) => new Promise((r) => chrome.storage.sync.set(v, r)), values);
  await page.close();
}

async function capture(context, url, viewport) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  await page.goto(url);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.waitForTimeout(150);
  const png = await page.screenshot({ type: "png" });
  await page.close();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const FRAME_CSS = `
  * { box-sizing: border-box; }
  html, body { margin: 0; width: 1280px; height: 800px; overflow: hidden; }
  body { font-family: Inter, sans-serif; background: #f6f3f2; color: #1f1f1f; padding: 34px 40px; }
  h1 { margin: 0; font-size: 34px; font-weight: 800; letter-spacing: -0.02em; display: flex; align-items: center; gap: 14px; }
  h1 img { width: 40px; height: 40px; border-radius: 9px; }
  .sub { margin: 6px 0 22px 54px; font-size: 18px; color: #555; }
`;

// Two captures of the same page side by side: setting off, setting on.
function beforeAfter(title, subtitle, before, after) {
  return `<!doctype html><html><head><style>${FRAME_CSS}
    .panes { display: flex; gap: 24px; }
    .pane { flex: 1; }
    .label { font-size: 15px; font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; }
    .shot { width: 588px; height: 588px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,.14); background: #fff; }
    .shot img { width: 100%; display: block; }
  </style></head><body>
    <h1><img src="${dataUrl(ICON)}" alt="">${esc(title)}</h1>
    <div class="sub">${esc(subtitle)}</div>
    <div class="panes">
      <div class="pane"><div class="label"><span class="dot" style="background:#9e9e9e"></span>Without the blocker</div><div class="shot"><img src="${before}"></div></div>
      <div class="pane"><div class="label"><span class="dot" style="background:#e5322d"></span>With Reels &amp; Shorts Blocker</div><div class="shot"><img src="${after}"></div></div>
    </div>
  </body></html>`;
}

function popupFrame(popup) {
  return `<!doctype html><html><head><style>${FRAME_CSS}
    body { display: flex; align-items: center; gap: 70px; padding: 0 90px; background: linear-gradient(135deg, #fff5f4, #f3eeee); }
    .copy { flex: 1; }
    h1 { font-size: 44px; line-height: 1.1; display: block; }
    h1 img { width: 64px; height: 64px; border-radius: 14px; display: block; margin-bottom: 22px; }
    ul { margin: 26px 0 0; padding: 0; list-style: none; font-size: 21px; line-height: 1.5; color: #333; }
    li { padding-left: 30px; position: relative; margin-bottom: 10px; }
    li::before { content: ""; position: absolute; left: 0; top: 10px; width: 12px; height: 12px; border-radius: 3px; background: #e5322d; }
    .popup { width: 448px; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,.18); border: 1px solid #e6e6e6; }
    .popup img { width: 100%; display: block; }
  </style></head><body>
    <div class="copy">
      <h1><img src="${dataUrl(ICON)}" alt="">One switch per site</h1>
      <ul>
        <li>Hide Shorts and Reels on YouTube, Facebook and Instagram</li>
        <li>Open single Shorts and reels as normal videos</li>
        <li>Changes apply to open tabs instantly</li>
        <li>No account, no tracking, no data collected</li>
      </ul>
    </div>
    <div class="popup"><img src="${popup}"></div>
  </body></html>`;
}

async function render(browserContext, html, file, size) {
  const page = await browserContext.newPage();
  await page.setViewportSize(size);
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: file, type: "png" });
  await page.close();
  console.log(`Wrote ${path.relative(ROOT, file)}`);
}

async function main() {
  const extDir = stage(fs.mkdtempSync(path.join(os.tmpdir(), "rsb-store-")));
  process.on("exit", () => fs.rmSync(extDir, { recursive: true, force: true }));
  const extId = [...crypto.createHash("sha256").update(extDir).digest("hex").slice(0, 32)]
    .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
    .join("");

  fs.mkdirSync(SHOTS, { recursive: true });
  const context = await launch(extDir);
  try {
    // The popup, captured at 2x so it stays sharp when enlarged.
    const popupPage = await context.newPage({ deviceScaleFactor: 2 });
    await popupPage.setViewportSize({ width: 280, height: 600 });
    await popupPage.goto(`chrome-extension://${extId}/popup/popup.html`);
    await popupPage.addStyleTag({ content: "body { font-family: Inter, sans-serif; }" });
    await popupPage.waitForFunction(() => document.querySelector("input[data-key]").checked);
    const popup = `data:image/png;base64,${(await popupPage.locator("body").screenshot()).toString("base64")}`;
    await popupPage.close();
    await render(context, popupFrame(popup), path.join(SHOTS, "1-popup.png"), { width: 1280, height: 800 });

    const pages = [
      ["2-youtube.png", "https://www.youtube.com/", { ytHideShorts: false }, { ytHideShorts: true },
        "YouTube: Shorts gone", "The Shorts shelf, Shorts videos, the sidebar entry and the Shorts filter are hidden."],
      ["3-facebook.png", "https://www.facebook.com/", { fbHideReels: false }, { fbHideReels: true },
        "Facebook: Reels gone", "Reels posts, the Reels shelf and the Reels menu entry are hidden."],
      ["4-instagram.png", "https://www.instagram.com/", { igHideReels: false }, { igHideReels: true },
        "Instagram: Reels gone", "Reels posts and the Reels menu entry are hidden; single reels open as normal posts."],
    ];
    const viewport = { width: 880, height: 880 };
    for (const [file, url, off, on, title, subtitle] of pages) {
      await setOptions(context, extId, off);
      const before = await capture(context, url, viewport);
      await setOptions(context, extId, on);
      const after = await capture(context, url, viewport);
      await render(context, beforeAfter(title, subtitle, before, after), path.join(SHOTS, file), { width: 1280, height: 800 });
    }

    const tile = fs.readFileSync(path.join(SRC, "promo-tile.html"), "utf8").replace("ICON", dataUrl(ICON));
    await render(context, tile, path.join(OUT, "promo-tile-440x280.png"), { width: 440, height: 280 });
  } finally {
    await context.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
