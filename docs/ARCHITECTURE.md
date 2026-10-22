# Architecture

The extension is a Manifest V3 extension with no build step and no background script. It has
four parts: shared settings and URL-rule scripts, one content script and stylesheet per site, and a
popup.

```
manifest.json          declares the content scripts, the popup and the "storage" permission
settings.js            defaults + storage and URL-change helpers, loaded everywhere
urls.js                pure URL rules (Shorts, Reels pages, Instagram redirects), unit-tested
content/youtube.css    hiding rules for YouTube, gated on <html data-rsb-yt-shorts>
content/youtube.js     sets that flag, marks the "Shorts" filter chip, redirects Shorts
content/facebook.css   one rule: hide [data-rsb-hidden] while <html data-rsb-fb-reels> is set
content/facebook.js    finds Reels links, marks their container, blocks Reels pages
content/instagram.css  one rule: hide [data-rsb-hidden] while <html data-rsb-ig-reels> is set
content/instagram.js   finds Reels links, marks their container, opens reels as posts
popup/                 toggle UI that writes settings to storage
scripts/package.js     builds the store zip from the runtime files only
test/, tests/smoke.js  unit, jsdom and browser tests (dev only, not shipped)
```

## Settings flow

1. `RSB_DEFAULTS` in `settings.js` defines six booleans: `ytHideShorts`, `ytRedirectShorts`,
   `fbHideReels`, `fbBlockReelsPages`, `igHideReels` and `igBlockReelsPages`. All default to on.
2. The popup reads them from `chrome.storage.sync` and writes a key whenever a toggle changes.
3. Each content script calls `rsbWatchSettings(apply)`, which calls `apply` three ways: right away
   with the defaults (so nothing flashes on screen while storage loads), again with the stored
   values, and again after every `storage.onChanged` event. That is why changes reach open tabs
   without a reload. The second argument to `apply` says whether the values came from storage;
   redirects wait for that, so a user who switched a redirect off is never redirected on load.

## How blocking rules are applied

The content scripts run at `document_start` on the top frame of `https://*.youtube.com/*`,
`https://*.facebook.com/*` and `https://*.instagram.com/*`. Hiding always works the same way: the script sets a flag attribute on
`<html>` and the site's stylesheet hides matching elements with `display: none !important`, but
only while the flag is present. Turning a setting off removes the flag, and everything reappears
without touching the page further.

### YouTube

- **Hiding** is almost entirely CSS (`content/youtube.css`). YouTube uses stable custom element
  names, so the rules target Shorts shelves (`ytd-reel-shelf-renderer`,
  `ytd-rich-shelf-renderer[is-shorts]`, …), any video tile that contains an
  `a[href^="/shorts/"]` or a `SHORTS` overlay (using `:has()`), the sidebar entries, the channel
  "Shorts" tab, and the `ytm-*` equivalents on m.youtube.com.
- **Filter chip:** the "Shorts" search filter can only be identified by its text, so
  `youtube.js` watches the DOM with a `MutationObserver` (batched to one pass per animation
  frame), checks each new chip once (`data-rsb-seen`), and marks the one labelled "Shorts" with
  `data-rsb-hidden`, which the CSS hides.
- **Redirect:** when `ytRedirectShorts` is on, `/shorts/<id>` becomes `/watch?v=<id>`. This
  happens in three places:
  - on load and on every settings change;
  - in a capturing `click` listener, which runs before YouTube's single-page router. It handles
    only plain left-clicks on same-origin links.
  - on `yt-navigate-finish` and `popstate`, for other in-app navigation such as back and forward.

### Facebook

- **Hiding:** Facebook's class names are obfuscated, so `facebook.js` finds Reels by their links
  (`/reel/…`, `/reels/…`). On each DOM change, batched per animation frame, it looks at links it
  hasn't seen before and calls `containerFor(link)`. That walks up to the enclosing feed post
  (the direct child of `[role="feed"]`, a `FeedUnit` pagelet or an `[aria-posinset]` item). If the
  link is in navigation, it takes the list item instead; otherwise the closest tab or article, and
  failing that the link itself. The container gets `data-rsb-hidden`, which `facebook.css` hides
  while `data-rsb-fb-reels` is set.
- **Page blocking:** when `fbBlockReelsPages` is on and the path starts with `/reel` or `/reels`,
  the script calls `location.replace("/")`. Facebook is a single-page app, so the same check also
  runs from the `MutationObserver` (only when the URL has changed) and on `popstate`.

### Instagram

- **Hiding:** like Facebook, Instagram has no stable class names, so `instagram.js` finds Reels by
  their links (`/reel/…`, `/reels/…`, `/<user>/reels`) on each DOM change, batched per animation
  frame. `igContainerFor(link)` takes the enclosing `article` (feed post) or `[role="tab"]`
  (profile tab), and otherwise the link itself (grid tiles and nav entries are the link). The post
  currently open is never hidden for linking to itself.
- **Redirects:** when `igBlockReelsPages` is on, `rsbInstagramRedirect()` in `urls.js` sends
  `/reel/<code>` to the normal post page `/p/<code>/`, the Reels feed to `/` and a profile's Reels
  tab to the profile. If Instagram bounces the post straight back to the reel within 10 seconds,
  the script goes to `/` instead of looping; it keeps the last redirect target and time in the
  tab's `sessionStorage` for that check.

## When a site changes its layout

Selectors are the part that breaks. For YouTube, update `content/youtube.css`. For Facebook,
update `REEL_LINKS` and `containerFor()` in `content/facebook.js`; for Instagram,
`IG_REEL_LINKS` and `igContainerFor()` in `content/instagram.js`. Then update the matching fixture
in `test/fixtures/` (see `docs/SELECTORS.md`).
