// Shared by the content scripts and the popup.
const RSB_DEFAULTS = {
  ytHideShorts: true,
  ytRedirectShorts: true,
  fbHideReels: true,
  fbBlockReelsPages: true,
};

// Calls `apply` with the defaults right away (so nothing flashes before
// storage answers), then with the stored settings, then on every change.
// The second argument says whether the settings came from storage: anything
// that navigates away should wait for that, or a user who switched an option
// off would still be redirected on page load.
function rsbWatchSettings(apply) {
  apply({ ...RSB_DEFAULTS }, false);
  const load = () => chrome.storage.sync.get(RSB_DEFAULTS, (stored) => apply(stored, true));
  load();
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (area === "sync") load();
  });
}

// Toggles a data attribute on <html>; the CSS files key off these.
function rsbSetFlag(name, on) {
  const root = document.documentElement;
  if (on) root.setAttribute(name, "");
  else root.removeAttribute(name);
}

// Calls `onChange` whenever the page URL changes, including the
// history.pushState navigations that single-page apps use. The Navigation API
// reports those directly; where it's missing, the caller's MutationObserver
// (which compares URLs anyway) and popstate cover it.
function rsbWatchUrl(onChange) {
  if (window.navigation) navigation.addEventListener("currententrychange", onChange);
  window.addEventListener("popstate", onChange);
}
