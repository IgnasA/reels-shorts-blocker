// Facebook's markup has no stable class names, so Reels are found by their
// links (/reel/<id>, /reels/) and the surrounding block is marked hidden.

const REEL_LINKS = [
  'a[href*="/reel/"]',
  'a[href*="/reels/"]',
  'a[href$="/reel"]',
  'a[href$="/reels"]',
]
  .map((s) => `${s}:not([data-rsb-seen])`)
  .join(", ");
const REEL_PAGE = /^\/(reel|reels)(\/|$)/;

let settings = { ...RSB_DEFAULTS };
let lastUrl = "";
let loaded = false;

// The block worth hiding for a Reels link: the whole feed post / "Reels" shelf,
// the sidebar or tab entry, or failing that the card the link sits in.
function containerFor(link) {
  for (let n = link; n && n !== document.body; n = n.parentElement) {
    if (n.parentElement?.getAttribute("role") === "feed") return n;
    if (n.matches('[data-pagelet^="FeedUnit"], [aria-posinset]')) return n;
  }
  if (link.closest('[role="navigation"], [role="banner"]')) return link.closest("li") || link;
  return link.closest('[role="tab"], [role="article"]') || link;
}

function hideReels() {
  for (const link of document.querySelectorAll(REEL_LINKS)) {
    link.setAttribute("data-rsb-seen", "");
    containerFor(link).setAttribute("data-rsb-hidden", "");
  }
}

function blockReelPage() {
  if (!loaded || location.href === lastUrl) return;
  lastUrl = location.href;
  if (settings.fbBlockReelsPages && REEL_PAGE.test(location.pathname)) location.replace("/");
}

rsbWatchSettings((next, fromStorage) => {
  settings = next;
  loaded ||= fromStorage;
  rsbSetFlag("data-rsb-fb-reels", settings.fbHideReels);
  lastUrl = "";
  blockReelPage();
});

// Facebook is a single-page app, so URL changes are picked up here too.
let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    blockReelPage();
    hideReels();
  });
}).observe(document.documentElement, { childList: true, subtree: true });

window.addEventListener("popstate", blockReelPage);
