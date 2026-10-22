// YouTube and Facebook redirects, including the "switch is off" case: the
// scripts apply the defaults before storage answers, so a redirect started
// on that first call would ignore the user's choice.
const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers");

const yt = (pathname, stored) =>
  load({ url: "https://www.youtube.com" + pathname, script: "content/youtube.js", stored });
const fb = (pathname, stored) =>
  load({ url: "https://www.facebook.com" + pathname, script: "content/facebook.js", stored });

test("YouTube Shorts open in the normal player", () => {
  assert.deepEqual(yt("/shorts/dQw4w9WgXcQ").redirects, ["/watch?v=dQw4w9WgXcQ"]);
  assert.deepEqual(yt("/watch?v=dQw4w9WgXcQ").redirects, []);
});

test("YouTube Shorts are left alone when the switch is off", () => {
  assert.deepEqual(yt("/shorts/dQw4w9WgXcQ", { ytRedirectShorts: false }).redirects, []);
});

test("Facebook Reels pages go to the home feed", () => {
  assert.deepEqual(fb("/reel/123456789").redirects, ["/"]);
  assert.deepEqual(fb("/watch/").redirects, []);
});

test("Facebook Reels pages are left alone when the switch is off", () => {
  assert.deepEqual(fb("/reel/123456789", { fbBlockReelsPages: false }).redirects, []);
});

test("turning a redirect on from the popup applies to the open tab", () => {
  const page = fb("/reel/123456789", { fbBlockReelsPages: false });
  page.setStored({ fbBlockReelsPages: true });
  assert.deepEqual(page.redirects, ["/"]);
});
