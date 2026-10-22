// The real extension on fixture YouTube pages (see test/browser.js).
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

// Waits a couple of frames so the content script's observer has run.
const settle = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));

test("hides Shorts on desktop pages and leaves everything else", async () => {
  const page = await open("https://www.youtube.com/results?search_query=cats");
  await settle(page);
  assert.deepEqual(await wrongVisibility(page), []);
});

test("hides Shorts on m.youtube.com", async () => {
  const page = await open("https://m.youtube.com/");
  await settle(page);
  assert.deepEqual(await wrongVisibility(page), []);
});

test("Shorts added after load are hidden before they are painted", async () => {
  const page = await open("https://www.youtube.com/");
  const shownInFirstFrame = await page.evaluate(() => {
    document.querySelector("#home").insertAdjacentHTML(
      "beforeend",
      '<ytd-rich-item-renderer id="late"><a href="/shorts/latelatelat">Late Short</a></ytd-rich-item-renderer>'
    );
    // This rAF is queued after the content script's, so it sees the frame as painted.
    return new Promise((r) => queueMicrotask(() => requestAnimationFrame(() => r(document.querySelector("#late").checkVisibility()))));
  });
  assert.equal(shownInFirstFrame, false);
});

test("the Shorts chip is re-checked when YouTube reuses chip elements", async () => {
  const page = await open("https://www.youtube.com/results?search_query=cats");
  await settle(page);
  await page.evaluate(() => {
    document.querySelector("#chip-shorts div").textContent = "Live";
    document.querySelector("#chip-videos div").textContent = "Shorts";
  });
  await settle(page);
  assert.equal(await page.locator("#chip-shorts").isVisible(), true, "relabelled chip should show");
  assert.equal(await page.locator("#chip-videos").isVisible(), false, "new Shorts chip should hide");
});

test("opening a Short loads it in the watch player", async () => {
  const page = await open("https://www.youtube.com/shorts/sjw42ZJ1OE8");
  await page.waitForURL("https://www.youtube.com/watch?v=sjw42ZJ1OE8");
});

test("clicking a Shorts link goes to the watch player, keeping the start time", async () => {
  const page = await open("https://www.youtube.com/");
  await page.click("#shorts-link");
  await page.waitForURL("https://www.youtube.com/watch?v=sjw42ZJ1OE8&t=7");
});

test("an in-app (pushState) navigation to a Short is redirected", async () => {
  const page = await open("https://www.youtube.com/");
  await page.evaluate(() => history.pushState({}, "", "/shorts/M93h41hyPsM"));
  await page.waitForURL("https://www.youtube.com/watch?v=M93h41hyPsM");
});

test("back/forward onto a Short is redirected", async () => {
  const page = await open("https://www.youtube.com/");
  await page.evaluate(() => {
    history.pushState({}, "", "/shorts/M93h41hyPsM");
  });
  await page.waitForURL(/watch\?v=M93h41hyPsM/);
  await page.goBack();
  await page.waitForURL("https://www.youtube.com/");
  await page.goForward();
  await page.waitForURL(/watch\?v=M93h41hyPsM/);
});

test("a channel's Shorts tab goes to its Videos tab", async () => {
  const page = await open("https://www.youtube.com/@SomeChannel/shorts");
  await page.waitForURL("https://www.youtube.com/@SomeChannel/videos");
});

test("with Hide Shorts off, nothing is hidden and the Shorts tab opens", async () => {
  await setOption(context, "ytHideShorts", false);
  const page = await open("https://www.youtube.com/@SomeChannel/shorts");
  await settle(page);
  assert.equal(page.url(), "https://www.youtube.com/@SomeChannel/shorts");
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('[data-expect="hidden"]')].filter((el) => !el.checkVisibility()).map((el) => el.dataset.name)
  );
  assert.deepEqual(hidden, []);
});

test("switching Hide Shorts off applies to an open tab without a reload", async () => {
  const page = await open("https://www.youtube.com/");
  await settle(page);
  assert.equal(await page.locator('[data-name="home Short item"]').isVisible(), false);
  await setOption(context, "ytHideShorts", false);
  await page.locator('[data-name="home Short item"]').waitFor({ state: "visible" });
});

test("with the redirect off, a Short opened directly stays a Short", async () => {
  await setOption(context, "ytRedirectShorts", false);
  const page = await open("https://www.youtube.com/shorts/sjw42ZJ1OE8");
  await page.waitForTimeout(500);
  assert.equal(page.url(), "https://www.youtube.com/shorts/sjw42ZJ1OE8");
  await page.click("#shorts-link");
  await page.waitForURL("https://www.youtube.com/shorts/sjw42ZJ1OE8?t=7");
});
