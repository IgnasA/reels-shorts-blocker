// Like Facebook, Instagram has no stable class names, so Reels are found by
// their links (/reel/<code>, /reels/, /<user>/reels/) and the surrounding
// block is marked hidden. Reels pages are left: a single reel opens as a
// normal post (/p/<code>) and the Reels feed goes back to the home feed.

const IG_REEL_LINKS = ['a[href*="/reel/"]', 'a[href*="/reels/"]', 'a[href$="/reels"]']
  .map((s) => `${s}:not([data-rsb-seen])`)
  .join(", ");
const IG_REEL = /^\/reels?\/([\w-]+)\/?$/;
const IG_REELS_FEED = /^\/reels(\/|$)/;
const IG_PROFILE_REELS = /^\/([\w.]+)\/reels\/?$/;
const IG_POST = /^\/(?:p|reels?)\/([\w-]+)/;
// If Instagram sends /p/<code> straight back to /reel/<code>, give up and go home.
const IG_LOOP_MS = 10000;

let settings = { ...RSB_DEFAULTS };
let lastUrl = "";
let loaded = false;

// Where to send a Reels page instead, or null to leave it alone.
function igRedirectFor(path) {
  const reel = path.match(IG_REEL);
  if (reel) return `/p/${reel[1]}/`;
  if (IG_REELS_FEED.test(path)) return "/";
  const profile = path.match(IG_PROFILE_REELS);
  if (profile) return `/${profile[1]}/`;
  return null;
}

// The block worth hiding for a Reels link: the feed post, the profile tab,
// or failing that the link itself (grid tiles and nav entries are the link).
function igContainerFor(link) {
  return link.closest('article, [role="tab"]') || link;
}

// The post open on screen, so it isn't hidden for linking to itself.
function igCurrentPost() {
  return location.pathname.match(IG_POST)?.[1] || null;
}

function igHideReels() {
  const current = igCurrentPost();
  for (const link of document.querySelectorAll(IG_REEL_LINKS)) {
    link.setAttribute("data-rsb-seen", "");
    const code = new URL(link.href, location.href).pathname.match(IG_REEL)?.[1];
    if (current && code === current) continue;
    igContainerFor(link).setAttribute("data-rsb-hidden", "");
  }
}

function igBlockReelPage() {
  if (!loaded || location.href === lastUrl) return;
  lastUrl = location.href;
  if (!settings.igBlockReelsPages) return;
  let target = igRedirectFor(location.pathname);
  if (!target) return;
  if (target.startsWith("/p/")) {
    const now = Date.now();
    try {
      const prev = JSON.parse(sessionStorage.getItem("rsb-ig-redirect") || "null");
      if (prev && prev.target === target && now - prev.at < IG_LOOP_MS) target = "/";
      else sessionStorage.setItem("rsb-ig-redirect", JSON.stringify({ target, at: now }));
    } catch {}
  }
  location.replace(target);
}

rsbWatchSettings((next, fromStorage) => {
  settings = next;
  loaded ||= fromStorage;
  rsbSetFlag("data-rsb-ig-reels", settings.igHideReels);
  lastUrl = "";
  igBlockReelPage();
});

// Instagram is a single-page app, so URL changes are picked up here too.
let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    igBlockReelPage();
    igHideReels();
  });
}).observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("popstate", igBlockReelPage);
