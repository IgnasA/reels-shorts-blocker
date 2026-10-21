// Unit tests for the URL rules in urls.js, loaded the way Chrome loads a
// content script: as a plain script, not a module.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const context = vm.createContext({ URLSearchParams });
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "urls.js"), "utf8"), context);
const { rsbShortsWatchUrl, rsbShortsTabRedirect, rsbIsReelPage } = vm.runInContext(
  "({ rsbShortsWatchUrl, rsbShortsTabRedirect, rsbIsReelPage })",
  context
);

test("a Short opens in the watch player", () => {
  assert.equal(rsbShortsWatchUrl("/shorts/sjw42ZJ1OE8"), "/watch?v=sjw42ZJ1OE8");
  assert.equal(rsbShortsWatchUrl("/shorts/sjw42ZJ1OE8/"), "/watch?v=sjw42ZJ1OE8");
  assert.equal(rsbShortsWatchUrl("/shorts/a-b_c-D_e-F"), "/watch?v=a-b_c-D_e-F");
});

test("the start time survives the redirect, other parameters don't", () => {
  assert.equal(rsbShortsWatchUrl("/shorts/sjw42ZJ1OE8", "?t=42"), "/watch?v=sjw42ZJ1OE8&t=42");
  assert.equal(rsbShortsWatchUrl("/shorts/sjw42ZJ1OE8", "?feature=share&si=xyz"), "/watch?v=sjw42ZJ1OE8");
});

test("only single Shorts are redirected", () => {
  for (const p of ["/shorts", "/shorts/", "/shorts/abc", "/shorts/sjw42ZJ1OE8/extra", "/watch", "/", "/@chan/shorts", "/feed/shorts", "/x/shorts/sjw42ZJ1OE8"]) {
    assert.equal(rsbShortsWatchUrl(p), null, p);
  }
});

test("a channel's Shorts tab goes to its Videos tab", () => {
  assert.equal(rsbShortsTabRedirect("/@MrBeast/shorts"), "/@MrBeast/videos");
  assert.equal(rsbShortsTabRedirect("/@MrBeast/shorts/"), "/@MrBeast/videos");
  assert.equal(rsbShortsTabRedirect("/channel/UCX6OQ3DkcsbYNE6H8uQQuVA/shorts"), "/channel/UCX6OQ3DkcsbYNE6H8uQQuVA/videos");
  assert.equal(rsbShortsTabRedirect("/c/SomeName/shorts"), "/c/SomeName/videos");
  assert.equal(rsbShortsTabRedirect("/user/someone/shorts"), "/user/someone/videos");
});

test("other channel pages are left alone", () => {
  for (const p of ["/@MrBeast", "/@MrBeast/videos", "/@MrBeast/shorts/extra", "/shorts/sjw42ZJ1OE8", "/results", "/hashtag/cats/shorts", "/watch"]) {
    assert.equal(rsbShortsTabRedirect(p), null, p);
  }
});

test("Facebook Reels pages are recognised", () => {
  for (const p of ["/reel/1234567890", "/reel/1234567890/", "/reels", "/reels/", "/reels/create", "/reel", "/share/r/AbCdEf123/"]) {
    assert.ok(rsbIsReelPage(p), p);
  }
});

test("other Facebook pages are not", () => {
  for (const p of ["/", "/watch", "/watch/?v=1", "/reelsfan", "/someone/reels", "/groups/reel/", "/share/p/abc", "/marketplace"]) {
    assert.ok(!rsbIsReelPage(p), p);
  }
});
