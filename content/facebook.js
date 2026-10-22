// Facebook's markup has no stable class names, so Reels are found by their
// links (/reel/<id>, /reels/, /share/r/<id>) and the surrounding block is
// marked hidden.

const REEL_LINKS = [
  'a[href*="/reel/"]',
  'a[href*="/reels/"]',
  'a[href$="/reel"]',
  'a[href$="/reels"]',
  'a[href*="/share/r/"]',
].join(", ");

let settings = { ...RSB_DEFAULTS };
let loaded = false;
let lastUrl = "";

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

function hideLink(link) {
  if (link.hasAttribute("data-rsb-seen")) return;
  link.setAttribute("data-rsb-seen", "");
  containerFor(link).setAttribute("data-rsb-hidden", "");
}

// Only the parts of the page that changed are searched: Facebook's DOM is
// large and mutates constantly, so rescanning the whole document every frame
// would be wasteful.
function hideReelsIn(root) {
  if (root.matches(REEL_LINKS)) hideLink(root);
  for (const link of root.querySelectorAll(REEL_LINKS)) hideLink(link);
}

// Redirects wait for the stored settings (see rsbWatchSettings).
function blockReelPage() {
  if (!loaded || location.href === lastUrl) return;
  lastUrl = location.href;
  if (settings.fbBlockReelsPages && rsbIsReelPage(location.pathname)) location.replace("/");
}

rsbWatchSettings((next, fromStorage) => {
  settings = next;
  loaded ||= fromStorage;
  rsbSetFlag("data-rsb-fb-reels", settings.fbHideReels);
  lastUrl = "";
  blockReelPage();
});

// Changed subtrees are collected as mutations arrive and handled once per
// frame. requestAnimationFrame runs before the next paint, so nothing flashes.
const pending = new Set();
let scheduled = false;

function flush() {
  scheduled = false;
  blockReelPage();
  for (const node of pending) if (node.isConnected) hideReelsIn(node);
  pending.clear();
}

new MutationObserver((mutations) => {
  for (const m of mutations) {
    if (m.type === "attributes") pending.add(m.target);
    else for (const node of m.addedNodes) if (node.nodeType === Node.ELEMENT_NODE) pending.add(node);
  }
  if (pending.size && !scheduled) {
    scheduled = true;
    requestAnimationFrame(flush);
  }
}).observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["href"],
});

// Anything already in the page when the script starts (normally nothing at
// document_start, but the script may also be injected later).
if (document.body) {
  pending.add(document.body);
  scheduled = true;
  requestAnimationFrame(flush);
}

// Facebook is a single-page app, so URL changes are watched as well.
rsbWatchUrl(blockReelPage);
