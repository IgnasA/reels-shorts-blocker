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

// Instagram Reels pages -> where to send them instead, or null to leave the
// page alone: a single reel (/reel/<code>, /reels/<code>) opens as a normal
// post, the Reels feed goes to the home feed and a profile's Reels tab to the
// profile.
function rsbInstagramRedirect(pathname) {
  const reel = pathname.match(/^\/reels?\/([\w-]+)\/?$/);
  if (reel) return `/p/${reel[1]}/`;
  if (/^\/reels(\/|$)/.test(pathname)) return "/";
  const profile = pathname.match(/^\/([\w.]+)\/reels\/?$/);
  return profile ? `/${profile[1]}/` : null;
}
