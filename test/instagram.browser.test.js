// The real extension on a fixture Instagram page (see test/browser.js).
const test = require("node:test");
const assert = require("node:assert/strict");
const { launch, setOption, wrongVisibility } = require("./browser.js");

let context;
test.beforeEach(async () => (context = await launch()));
test.afterEach(() => context.close());

async function open(url) {
  const page = await context.newPage();
  await page.goto(url);
  return page;
}

const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

test("hides Reels posts, grid tiles, the nav entry and the profile tab, and leaves everything else", async () => {
  const page = await open("https://www.instagram.com/");
  await settle(page);
  assert.deepEqual(await wrongVisibility(page), []);
});

test("a single reel opens as a normal post", async () => {
  const page = await open("https://www.instagram.com/reel/ABC123/");
  await page.waitForURL("https://www.instagram.com/p/ABC123/");
});

test("the Reels feed redirects to the home feed", async () => {
  const page = await open("https://www.instagram.com/reels/");
  await page.waitForURL("https://www.instagram.com/");
});

test("an in-app (pushState) navigation to a reel opens the post", async () => {
  const page = await open("https://www.instagram.com/");
  await page.evaluate(() => history.pushState({}, "", "/reel/XYZ789/"));
  await page.waitForURL("https://www.instagram.com/p/XYZ789/");
});

test("with Hide Reels off, nothing is hidden", async () => {
  await setOption(context, "igHideReels", false);
  const page = await open("https://www.instagram.com/");
  await settle(page);
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('[data-expect="hidden"]')].filter((el) => !el.checkVisibility()).map((el) => el.dataset.name)
  );
  assert.deepEqual(hidden, []);
});

test("with reel redirects off, a reel page stays open", async () => {
  await setOption(context, "igBlockReelsPages", false);
  const page = await open("https://www.instagram.com/reel/ABC123/");
  await page.waitForTimeout(500);
  assert.equal(page.url(), "https://www.instagram.com/reel/ABC123/");
});
