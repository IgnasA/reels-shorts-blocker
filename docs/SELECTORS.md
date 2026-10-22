# What gets blocked, and how

Last checked against the live sites on 2026-10-21 (logged out, en-US, from a
headless Chromium with the extension loaded). The extension runs only on
`*.youtube.com`, `*.facebook.com` and `*.instagram.com` (Instagram added afterwards; see its
section). TikTok isn't supported.

Status:
- **verified live**: seen working on the live site on the date above
- **fixture only**: covered by the fixture tests, but the live page didn't show
  that markup logged out, so it couldn't be checked
- **not verifiable**: needs a logged-in account

Fragility:
- **low**: keyed to a URL path or YouTube's own element names
- **medium**: keyed to an attribute YouTube could rename at any time
- **high**: keyed to visible text or to Facebook's page structure

## YouTube: hiding (`content/youtube.css`)

All rules apply only while `<html data-rsb-yt-shorts>` is set, which
`youtube.js` sets at `document_start` with the default settings, so nothing
flashes before storage answers. CSS rules apply as soon as an element is
inserted, so there's no flicker and no script work per element.

| Rule | Where | Status | Fragility |
| --- | --- | --- | --- |
| `grid-shelf-view-model:has(ytm-shorts-lockup-view-model[-v2])` | Search "Shorts" shelf (desktop and mobile) | verified live | low |
| `ytm-shorts-lockup-view-model[-v2]` | Any Shorts card | verified live | low |
| `ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts] / shorts lockups)` | Home and Subscriptions Shorts shelf | fixture only (logged-out home is empty) | medium (`is-shorts`) |
| `ytd-reel-shelf-renderer`, `ytm-reel-shelf-renderer` | Older Shorts shelf | fixture only | low |
| `ytd-rich-item-renderer`, `ytd-video-renderer`, `ytd-grid-video-renderer`, `ytd-compact-video-renderer`, `ytd-playlist-video-renderer`, `yt-lockup-view-model`, `ytm-*` `:has(a[href^="/shorts/"])` | A single Short in a grid, list, sidebar or playlist | verified live (mobile search) / fixture | low |
| `…:has([overlay-style="SHORTS"])` | Shorts that link to `/watch` but carry the Shorts badge | fixture only | medium |
| `ytd-mini-guide-entry-renderer:has(a[href^="/shorts"])` | Collapsed sidebar entry | verified live | low |
| `ytd-mini-guide-entry-renderer[aria-label="Shorts"]`, `ytd-guide-entry-renderer:has(a[title="Shorts"])` | Sidebar entry | fixture only | high (English label) |
| `yt-tab-shape[tab-title="Shorts"]` | Channel page tab | verified live | high (localized label); backed by the URL redirect below |
| `ytm-pivot-bar-item-renderer:has(.pivot-shorts)` | m.youtube.com bottom bar | verified live | medium (class name) |

## YouTube: script (`content/youtube.js`)

| Behaviour | Status | Fragility |
| --- | --- | --- |
| `/shorts/<id>` → `/watch?v=<id>` (keeps `?t=`), on load, on link click, on `pushState`, on back/forward, on `yt-navigate-finish` | verified live (load) and fixture (others) | low |
| `/@name/shorts`, `/channel/<id>/shorts`, `/c/…/shorts`, `/user/…/shorts` → `…/videos` | verified live | low |
| "Shorts" search filter chip, matched by its text and re-checked whenever the page changes | fixture only (no Shorts chip appeared in logged-out search) | high (English label) |

## Facebook (`content/facebook.js`)

Facebook needs a login to show a feed, so none of the hiding could be checked
live. `test/fixtures/facebook.html` is a hand-written stand-in, not a capture.

| Behaviour | Status | Fragility |
| --- | --- | --- |
| `/reel/…`, `/reels/…`, `/share/r/…` pages → `/` | verified live (logged out) | low |
| Links matching `/reel/`, `/reels/`, `…/reel`, `…/reels`, `/share/r/` are found and their container is marked `data-rsb-hidden` | not verifiable / fixture | low for the link test |
| Container = child of `[role="feed"]`, `[data-pagelet^="FeedUnit"]` or `[aria-posinset]`; in `[role="navigation"]` / `[role="banner"]` the `<li>`; else `[role="tab"]` / `[role="article"]`; else the link itself | not verifiable / fixture | high: if Facebook drops these roles, a Reel post would only lose its link, not the whole post |

If a Reel post slips through on Facebook, open DevTools on it, find the
`a[data-rsb-seen]` inside it and walk up to see which ancestor should match
in `containerFor()`.

## Instagram (`content/instagram.js`)

Added after the live check above. Instagram needs a login for most pages, so
the hiding is covered only by `test/fixtures/instagram.html` (hand-written)
and the jsdom tests in `test/instagram.test.js`.

| Behaviour | Status | Fragility |
| --- | --- | --- |
| `/reel/<code>` → `/p/<code>/`; `/reels/…` → `/`; `/<user>/reels/` → `/<user>/` (`rsbInstagramRedirect` in `urls.js`) | fixture / unit | low |
| Links matching `/reel/`, `/reels/`, `…/reels` are found and their container marked `data-rsb-hidden` | not verifiable / fixture | low for the link test |
| Container = closest `article` or `[role="tab"]`, else the link itself | not verifiable / fixture | high: keyed to Instagram's page structure |

Unlike the Facebook script, the Instagram one rescans the document once per
frame for unseen links and doesn't watch `href` changes; port the Facebook
approach if a Reel link that changes its `href` after insertion slips through.

## Performance

- Both scripts use one `MutationObserver` each (`childList` + `subtree`; on
  Facebook also `href` attribute changes), batched to one pass per animation
  frame. There is no polling and no timer.
- YouTube's per-frame pass only looks at the filter chips (a handful of
  elements); everything else is plain CSS.
- Facebook's pass only searches subtrees that were added or whose `href`
  changed, not the whole document.

Measured with an instrumented copy of the extension (numbers are the
extension's own callback time):

| Scenario | Calls | Total | Worst frame |
| --- | --- | --- | --- |
| Live YouTube search, scrolled 8 screens (≈15,000 elements) | 55 | 43 ms | 3.9 ms |
| Facebook fixture + 400 posts added in 40 batches (≈25,000 elements), original script | 41 | 62 ms | 3.3 ms |
| Same, new script | 40 | 7.5 ms | 0.7 ms |
