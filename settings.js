// Shared by the content scripts and the popup.
const RSB_DEFAULTS = {
  ytHideShorts: true,
  ytRedirectShorts: true,
  fbHideReels: true,
  fbBlockReelsPages: true,
  igHideReels: true,
  igBlockReelsPages: true,
};

// Calls `apply` with the defaults right away (so nothing flashes before
// storage answers), then with the stored settings, then on every change.
// `loaded` is false for the first call: redirects should wait for it, since a
// navigation started on the defaults can't be taken back if the user turned
// that option off.
function rsbWatchSettings(apply) {
  apply({ ...RSB_DEFAULTS }, false);
  const load = () => chrome.storage.sync.get(RSB_DEFAULTS, (s) => apply(s, true));
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
