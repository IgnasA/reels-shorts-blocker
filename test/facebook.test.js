// The real extension on a fixture Facebook page (see test/browser.js).
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

test("hides Reels posts, shelves, nav entries and tabs, and leaves everything else", async () => {
  const page = await open("https://www.facebook.com/");
  await settle(page);
  assert.deepEqual(await wrongVisibility(page), []);
});

test("a Reel added to the feed is hidden before it is painted", async () => {
  const page = await open("https://www.facebook.com/");
  await settle(page);
  const shownInFirstFrame = await page.evaluate(() => {
    document.querySelector("#feed").insertAdjacentHTML(
      "beforeend",
      '<div id="late"><div><div><a href="/reel/999/">Late Reel</a></div></div></div>'
    );
    // This rAF is queued after the content script's, so it sees the frame as painted.
    return new Promise((r) => queueMicrotask(() => requestAnimationFrame(() => r(document.querySelector("#late").checkVisibility()))));
  });
  assert.equal(shownInFirstFrame, false);
});

test("a link that only becomes a Reel link later is caught", async () => {
  const page = await open("https://www.facebook.com/");
  await page.evaluate(() =>
    document.querySelector("#feed").insertAdjacentHTML("beforeend", '<div id="late"><a href="#">Loading</a></div>')
  );
  await settle(page);
  assert.equal(await page.locator("#late").isVisible(), true);
  await page.evaluate(() => document.querySelector("#late a").setAttribute("href", "/reel/777/"));
  await settle(page);
  assert.equal(await page.locator("#late").isVisible(), false);
});

test("a Reels page redirects to the feed", async () => {
  const page = await open("https://www.facebook.com/reel/1234567890");
  await page.waitForURL("https://www.facebook.com/");
});

test("a shared Reel link redirects to the feed", async () => {
  const page = await open("https://www.facebook.com/share/r/AbCdEf123/");
  await page.waitForURL("https://www.facebook.com/");
});

test("an in-app (pushState) navigation to Reels redirects to the feed", async () => {
  const page = await open("https://www.facebook.com/");
  await page.evaluate(() => history.pushState({}, "", "/reels/"));
  await page.waitForURL("https://www.facebook.com/");
  assert.equal(new URL(page.url()).pathname, "/");
});

test("with Hide Reels off, nothing is hidden", async () => {
  await setOption(context, "fbHideReels", false);
  const page = await open("https://www.facebook.com/");
  await settle(page);
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('[data-expect="hidden"]')].filter((el) => !el.checkVisibility()).map((el) => el.dataset.name)
  );
  assert.deepEqual(hidden, []);
});

test("with Block Reels pages off, a Reels page stays open", async () => {
  await setOption(context, "fbBlockReelsPages", false);
  const page = await open("https://www.facebook.com/reel/1234567890");
  await page.waitForTimeout(500);
  assert.equal(page.url(), "https://www.facebook.com/reel/1234567890");
});
