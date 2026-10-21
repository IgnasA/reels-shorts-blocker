// End-to-end smoke test: loads the unpacked extension in Chromium and serves
// small stand-in pages for youtube.com / facebook.com, so no network or
// account is needed. Run with `node tests/smoke.js` (see README).

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");
const { execSync } = require("node:child_process");

function loadPlaywright() {
  try {
    return require("playwright");
  } catch {
    const globalRoot = execSync("npm root -g").toString().trim();
    return require(path.join(globalRoot, "playwright"));
  }
}

const { chromium } = loadPlaywright();
const EXT = path.resolve(__dirname, "..");

// Chrome derives an unpacked extension's ID from its absolute path.
const EXT_ID = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)]
  .map((c) => String.fromCharCode(97 + parseInt(c, 16)))
  .join("");

const YT_PAGE = `<html><body>
  <ytd-rich-item-renderer id="short"><a href="/shorts/abc123">short</a></ytd-rich-item-renderer>
  <ytd-rich-item-renderer id="video"><a href="/watch?v=xyz">video</a></ytd-rich-item-renderer>
  <a id="own" href="/shorts/abc123">own short</a>
  <a id="offsite" href="https://example.com/shorts/foo">offsite</a>
</body></html>`;

const FB_PAGE = `<html><body><div role="feed">
  <div id="reel-post"><a href="/reel/123">reel</a></div>
  <div id="post"><a href="/some.page/posts/1">post</a></div>
</div></body></html>`;

const display = (page, sel) => page.$eval(sel, (e) => getComputedStyle(e).display);

async function main() {
  const ctx = await chromium.launchPersistentContext("", {
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--headless=new"],
  });
  const html = (body) => (route) => route.fulfill({ contentType: "text/html", body });
  await ctx.route("https://www.youtube.com/**", html(YT_PAGE));
  await ctx.route("https://www.facebook.com/**", html(FB_PAGE));
  await ctx.route("https://example.com/**", html("example"));

  const page = await ctx.newPage();
  const check = async (name, fn) => {
    await fn();
    console.log(`ok - ${name}`);
  };

  try {
    await check("YouTube: Shorts hidden, normal videos kept", async () => {
      await page.goto("https://www.youtube.com/");
      await page.waitForFunction(() => document.documentElement.hasAttribute("data-rsb-yt-shorts"));
      assert.equal(await display(page, "#short"), "none");
      assert.notEqual(await display(page, "#video"), "none");
    });

    await check("YouTube: clicking a Shorts link opens /watch", async () => {
      await page.click("#own");
      await page.waitForURL("https://www.youtube.com/watch?v=abc123");
    });

    await check("YouTube: off-site /shorts/ links are left alone", async () => {
      await page.goto("https://www.youtube.com/");
      await page.click("#offsite");
      await page.waitForURL("https://example.com/shorts/foo");
    });

    await check("YouTube: /shorts/<id> redirects to /watch", async () => {
      await page.goto("https://www.youtube.com/shorts/def456");
      await page.waitForURL("https://www.youtube.com/watch?v=def456");
    });

    await check("Facebook: Reels posts hidden, other posts kept", async () => {
      await page.goto("https://www.facebook.com/");
      await page.waitForFunction(() => document.querySelector("#reel-post[data-rsb-hidden]"));
      assert.equal(await display(page, "#reel-post"), "none");
      assert.notEqual(await display(page, "#post"), "none");
    });

    await check("Facebook: /reel/<id> redirects to the feed", async () => {
      await page.goto("https://www.facebook.com/reel/999");
      await page.waitForURL("https://www.facebook.com/");
    });

    await check("Popup toggle turns hiding off in open tabs", async () => {
      await page.goto("https://www.youtube.com/");
      const popup = await ctx.newPage();
      await popup.goto(`chrome-extension://${EXT_ID}/popup/popup.html`);
      const toggle = popup.locator('input[data-key="ytHideShorts"]');
      await toggle.waitFor();
      assert.equal(await toggle.isChecked(), true);
      await toggle.uncheck();
      await page.waitForFunction(() => !document.documentElement.hasAttribute("data-rsb-yt-shorts"));
      assert.notEqual(await display(page, "#short"), "none");
      await toggle.check();
      await popup.close();
    });
  } finally {
    await ctx.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
