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
function rsbWatchSettings(apply) {
  apply({ ...RSB_DEFAULTS });
  const load = () => chrome.storage.sync.get(RSB_DEFAULTS, apply);
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
