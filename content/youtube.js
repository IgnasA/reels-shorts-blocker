// Hiding is done by youtube.css; this script flips the flag that enables it,
// hides the "Shorts" filter chip (only identifiable by its text), and sends
// /shorts/<id> to the regular /watch player.

let settings = { ...RSB_DEFAULTS };
let loaded = false;

// Redirects wait for the stored settings (see rsbWatchSettings).
function redirectIfShorts() {
  if (!loaded) return;
  const url =
    (settings.ytRedirectShorts && rsbShortsWatchUrl(location.pathname, location.search)) ||
    (settings.ytHideShorts && rsbShortsTabRedirect(location.pathname));
  if (url) location.replace(url);
}

// YouTube reuses chip elements when the chip bar changes, so the label is
// checked on every pass rather than once per element. There are only a few.
function hideShortsChips() {
  for (const chip of document.querySelectorAll("yt-chip-cloud-chip-renderer, chip-shape")) {
    const isShorts = chip.textContent.trim() === "Shorts";
    if (isShorts !== chip.hasAttribute("data-rsb-hidden")) chip.toggleAttribute("data-rsb-hidden", isShorts);
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
    if (!link) return;
    // Only YouTube's own links: an off-site URL that happens to contain
    // /shorts/ must open where it points, not as a YouTube video.
    const target = new URL(link.href, location.href);
    const url = target.origin === location.origin && rsbShortsWatchUrl(target.pathname, target.search);
    if (!url) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    location.assign(url);
  },
  true
);

// Any other in-app navigation (back/forward, swipes, router pushes).
rsbWatchUrl(redirectIfShorts);
document.addEventListener("yt-navigate-finish", redirectIfShorts);

let scheduled = false;
new MutationObserver(() => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    hideShortsChips();
  });
}).observe(document.documentElement, { childList: true, subtree: true });
