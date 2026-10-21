// Hiding is done by youtube.css; this script flips the flag that enables it,
// hides the "Shorts" filter chip (only identifiable by its text), and sends
// /shorts/<id> to the regular /watch player.

const SHORTS_PATH = /^\/shorts\/([\w-]+)/;
let settings = { ...RSB_DEFAULTS };
let loaded = false;

function watchUrlFor(path) {
  const m = path.match(SHORTS_PATH);
  return m ? `/watch?v=${m[1]}` : null;
}

function redirectIfShorts() {
  if (!loaded || !settings.ytRedirectShorts) return;
  const url = watchUrlFor(location.pathname);
  if (url) location.replace(url);
}

function hideShortsChips() {
  const chips = document.querySelectorAll(
    "yt-chip-cloud-chip-renderer:not([data-rsb-seen]), chip-shape:not([data-rsb-seen])"
  );
  for (const chip of chips) {
    chip.setAttribute("data-rsb-seen", "");
    if (chip.textContent.trim() === "Shorts") chip.setAttribute("data-rsb-hidden", "");
  }
}

rsbWatchSettings((next, fromStorage) => {
  settings = next;
  loaded ||= fromStorage;
  rsbSetFlag("data-rsb-yt-shorts", settings.ytHideShorts);
  redirectIfShorts();
});

// Catch clicks on Shorts links before YouTube's SPA router opens the Shorts player.
document.addEventListener(
  "click",
  (e) => {
    if (!settings.ytRedirectShorts || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const link = e.target.closest?.('a[href*="/shorts/"]');
    const url = link && watchUrlFor(new URL(link.href, location.href).pathname);
    if (!url) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    location.assign(url);
  },
  true
);

// Fallback for any other in-app navigation (back/forward, swipes, etc.).
document.addEventListener("yt-navigate-finish", redirectIfShorts);
window.addEventListener("popstate", redirectIfShorts);

let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    hideShortsChips();
  });
}).observe(document.documentElement, { childList: true, subtree: true });
