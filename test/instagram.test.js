const test = require("node:test");
const assert = require("node:assert/strict");
const { load } = require("./helpers");

const IG = "https://www.instagram.com";
const page = (pathname, opts = {}) =>
  load({
    url: IG + pathname,
    script: "content/instagram.js",
    exports: ["igRedirectFor", "igHideReels"],
    ...opts,
  });

test("igRedirectFor maps Reels pages and leaves everything else", () => {
  const { igRedirectFor } = page("/").api;
  const cases = {
    "/reel/C1a-B_2/": "/p/C1a-B_2/",
    "/reel/C1aB2": "/p/C1aB2/",
    "/reels/C1aB2/": "/p/C1aB2/",
    "/reels/": "/",
    "/reels": "/",
    "/reels/audio/123456/": "/",
    "/some.user/reels/": "/some.user/",
    "/some_user/reels": "/some_user/",
    "/": null,
    "/p/C1aB2/": null,
    "/explore/": null,
    "/some.user/": null,
    "/reelsfan/": null,
    "/direct/inbox/": null,
  };
  for (const [from, to] of Object.entries(cases)) assert.equal(igRedirectFor(from), to, from);
});

test("a reel URL is sent to the post page on load", () => {
  assert.deepEqual(page("/reel/ABC123/").redirects, ["/p/ABC123/"]);
});

test("the Reels feed is sent to the home feed", () => {
  assert.deepEqual(page("/reels/").redirects, ["/"]);
});

test("normal pages are not redirected", () => {
  assert.deepEqual(page("/p/ABC123/").redirects, []);
  assert.deepEqual(page("/").redirects, []);
});

test("nothing is redirected when the switch is off", () => {
  assert.deepEqual(page("/reel/ABC123/", { stored: { igBlockReelsPages: false } }).redirects, []);
});

test("bouncing back to the same reel goes home instead of looping", () => {
  const session = {
    "rsb-ig-redirect": JSON.stringify({ target: "/p/ABC123/", at: Date.now() - 1000 }),
  };
  assert.deepEqual(page("/reel/ABC123/", { session }).redirects, ["/"]);
});

test("an old redirect record does not count as a loop", () => {
  const session = {
    "rsb-ig-redirect": JSON.stringify({ target: "/p/ABC123/", at: Date.now() - 60000 }),
  };
  assert.deepEqual(page("/reel/ABC123/", { session }).redirects, ["/p/ABC123/"]);
});

test("Reels in the feed, grids, nav and profile tabs are hidden", () => {
  const { document, api } = page("/", {
    html: `
      <nav><div id="nav-home"><a href="/">Home</a></div><a id="nav-reels" href="/reels/">Reels</a></nav>
      <article id="post-photo"><a href="/p/PHOTO1/">photo</a></article>
      <article id="post-reel"><div><a href="/reel/REEL1/">reel</a></div></article>
      <div role="tablist">
        <a role="tab" id="tab-posts" href="/some.user/">Posts</a>
        <div role="tab" id="tab-reels"><a href="/some.user/reels/">Reels</a></div>
      </div>
      <div class="grid"><a id="tile-photo" href="/p/PHOTO2/">p</a><a id="tile-reel" href="/reel/REEL2/">r</a></div>`,
  });
  api.igHideReels();
  const hidden = [...document.querySelectorAll("[data-rsb-hidden]")].map((n) => n.id).sort();
  assert.deepEqual(hidden, ["nav-reels", "post-reel", "tab-reels", "tile-reel"]);
  assert.ok(document.documentElement.hasAttribute("data-rsb-ig-reels"));
});

test("the post open on screen is not hidden for linking to itself", () => {
  const { document, api } = page("/p/REEL1/", {
    html: `<article id="main"><a href="/reel/REEL1/">this post</a></article>
           <article id="other"><a href="/reel/REEL9/">more</a></article>`,
  });
  api.igHideReels();
  assert.ok(!document.getElementById("main").hasAttribute("data-rsb-hidden"));
  assert.ok(document.getElementById("other").hasAttribute("data-rsb-hidden"));
});

test("Reels added later by the app are hidden by the observer", async () => {
  const { document } = page("/");
  const article = document.createElement("article");
  article.innerHTML = '<a href="/reel/LATE1/">late</a>';
  document.body.append(article);
  await new Promise((r) => setTimeout(r, 50));
  assert.ok(article.hasAttribute("data-rsb-hidden"));
});

test("turning Hide Reels off from the popup removes the page flag", () => {
  const { document, setStored } = page("/");
  assert.ok(document.documentElement.hasAttribute("data-rsb-ig-reels"));
  setStored({ igHideReels: false });
  assert.ok(!document.documentElement.hasAttribute("data-rsb-ig-reels"));
});
