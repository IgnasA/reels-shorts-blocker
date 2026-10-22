// URL rules shared by the content scripts. Pure functions only, so they can be
// unit-tested outside the browser (see test/urls.test.js).

// /shorts/<id> -> /watch?v=<id>, keeping a start time if there is one.
// Returns null for anything that isn't a single Short.
function rsbShortsWatchUrl(pathname, search = "") {
  const m = pathname.match(/^\/shorts\/([\w-]{6,})\/?$/);
  if (!m) return null;
  const t = new URLSearchParams(search).get("t");
  return `/watch?v=${m[1]}` + (t ? `&t=${encodeURIComponent(t)}` : "");
}

// A channel's Shorts tab (/@name/shorts, /channel/<id>/shorts, ...) -> its
// Videos tab. The tab itself is hidden by youtube.css, but its label is
// localized, so this catches it in any language. Returns null otherwise.
function rsbShortsTabRedirect(pathname) {
  const m = pathname.match(/^(\/(?:@[^/]+|channel\/[^/]+|c\/[^/]+|user\/[^/]+))\/shorts\/?$/);
  return m ? `${m[1]}/videos` : null;
}

// Facebook Reels pages: /reel/<id>, /reels/..., and /share/r/<id> share links.
function rsbIsReelPage(pathname) {
  return /^\/(reels?|share\/r)(\/|$)/.test(pathname);
}
