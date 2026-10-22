# Security & Privacy Review

**Scope:** the whole repository at the start of this review (commit `9c471cc`): `manifest.json`,
`settings.js`, `content/*`, `popup/*`, `icons/*`.
**Date:** 2026-10-21
**Method:** manual review of every source file, a grep for dangerous sinks and network APIs, and an
end-to-end run of the unpacked extension in Chromium against stand-in pages (`tests/smoke.js`).

> **Addendum (2026-10-22, release 1.0.0).** After this review, Instagram support was added
> (`content/instagram.*`, content scripts on `https://*.instagram.com/*`, two more settings) and the
> URL rules moved to `urls.js`. The Instagram script follows the same pattern as the Facebook one:
> no network requests, no HTML from strings, same-origin redirects only. Its one new storage use is a
> loop guard in the Instagram tab's `sessionStorage` (`rsb-ig-redirect`: last redirect target and
> time), readable by Instagram's own scripts like the `data-rsb-*` attributes in finding #4. The
> findings below describe the code as reviewed; #3 and #5 apply equally to `*.instagram.com`.

## Summary

The extension has a small, sound attack surface. It asks for one API permission (`storage`), has
no background script, makes no network requests, loads no remote code and never writes HTML from
strings. **No critical, high or medium issues were found.** Two low-severity issues were fixed in
this branch; the rest are informational.

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | Low | Shorts click handler rewrote off-site links containing `/shorts/` | **Fixed** (`f3214b4`) |
| 2 | Low | Content scripts also matched plain `http://` pages | **Fixed** (`df830df`) |
| 3 | Low | Content scripts run on every `*.youtube.com` / `*.facebook.com` subdomain | Open, recommendation |
| 4 | Info | Pages can detect the extension and its settings via `data-rsb-*` attributes | Accepted (inherent to design) |
| 5 | Info | Facebook Reels detection can over-match | Open, recommendation |
| 6 | Info | Synthetic (untrusted) clicks are handled like real ones | No action needed |
| 7 | Info | Settings are stored in `chrome.storage.sync` | No action needed |

## Permissions

| Requested | Used by | Needed? |
|-----------|---------|---------|
| `storage` | `settings.js`, `popup/popup.js`: read and write four on/off settings | Yes |
| Content scripts on `https://*.youtube.com/*` | `content/youtube.*` | Yes (see #3 on subdomain breadth) |
| Content scripts on `https://*.facebook.com/*` | `content/facebook.*` | Yes (see #3) |
| Content scripts on `https://*.instagram.com/*` (added after this review) | `content/instagram.*` | Yes |

Not requested, and not needed: `host_permissions`, `tabs`, `activeTab`, `scripting`, `webRequest`,
`declarativeNetRequest`, `cookies`, `history`. There is no background service worker, no
`web_accessible_resources`, no `externally_connectable`, and no custom `content_security_policy`
(so the strict Manifest V3 default applies: extension pages may only run scripts bundled with the
extension). Content scripts run in the top frame only (`all_frames` is not set).

The resulting install warning is roughly "Read and change your data on youtube.com and
facebook.com", which matches what the extension does.

## Findings

### 1. Shorts click handler rewrote off-site links: Low, fixed

- **Location:** `content/youtube.js`, capturing `click` listener (before fix: lines 36-48).
- **Issue:** the handler matched any `<a>` whose `href` contained `/shorts/`, took only the URL's
  path, and navigated to `/watch?v=<id>` on YouTube. A link to another site, e.g.
  `https://example.com/shorts/foo`, was therefore opened as `youtube.com/watch?v=foo`.
- **Impact:** a link on a YouTube page that points off-site is silently redirected to a YouTube
  video whose ID is chosen by whoever wrote the link. That is unexpected navigation, not code
  execution. The ID is limited to `[\w-]` characters and the destination is always the current
  YouTube origin, so it cannot be turned into an open redirect or script injection. Exposure is also
  limited because YouTube usually wraps outbound links in `/redirect?q=…`, where `/shorts/` is
  percent-encoded.
- **Fix (applied):** only intercept links whose resolved origin equals the page's origin. The smoke
  test reproduced the bug before the change and checks the fix
  (`YouTube: off-site /shorts/ links are left alone`).
- **Confidence:** High.

### 2. Content scripts matched `http://`: Low, fixed

- **Location:** `manifest.json`, `content_scripts[].matches` (were `*://*.youtube.com/*` and
  `*://*.facebook.com/*`).
- **Issue:** `*://` also matches plain HTTP. Both sites serve only HTTPS and are on the HSTS
  preload list, so the extra scope did nothing useful. On an HTTP response a network attacker
  controls the page's DOM, which the content scripts then read.
- **Impact:** minimal. The scripts only read link `href`s and set attributes, so a hostile page
  gains nothing it couldn't already do. The change is about least privilege.
- **Fix (applied):** match `https://` only. Narrowing match patterns adds no new permission
  warning on update.
- **Confidence:** High.

### 3. Content scripts run on every subdomain: Low, open

- **Location:** `manifest.json`, `content_scripts[].matches`.
- **Issue:** `*.youtube.com` also covers `studio.`, `music.`, `tv.`, `accounts.` and other
  YouTube hosts, and `*.facebook.com` covers `developers.`, `business.`, `l.` and others. The
  scripts aren't useful there. On those hosts they add a document-wide `MutationObserver`, and on
  YouTube they also add a capturing click listener. On any Facebook host, a path starting
  `/reel` or `/reels` is redirected to `/`.
- **Impact:** no data is read or sent. The risks are least-privilege and correctness: wrong
  redirects or hidden elements on hosts the extension wasn't designed for, and a small
  performance cost.
- **Fix (recommended, not applied):** list the hosts explicitly, e.g.
  `https://www.youtube.com/*`, `https://m.youtube.com/*`, `https://www.facebook.com/*`,
  `https://m.facebook.com/*`, `https://web.facebook.com/*`. Use `exclude_matches` instead if
  wildcard coverage is preferred. This was not applied overnight because it could drop hosts that
  users rely on (`web.`, `touch.` and `mbasic.facebook.com`, for example) and should be checked
  by hand.
- **Confidence:** High that the scope is broader than needed. Medium on which hosts are safe to
  drop.

### 4. Pages can detect the extension: Info, accepted

- **Location:** `settings.js` `rsbSetFlag()`; `content/youtube.js` and `content/facebook.js` set
  `data-rsb-seen` and `data-rsb-hidden`.
- **Issue:** the extension marks the page DOM with `data-rsb-yt-shorts`, `data-rsb-fb-reels`,
  `data-rsb-seen` and `data-rsb-hidden`. Scripts on youtube.com or facebook.com can read these
  attributes, so the site can tell that this extension is installed and which toggles are on.
- **Impact:** a small fingerprinting signal, visible only to the two sites the extension already
  runs on. No user data is exposed.
- **Fix:** none needed. The CSS-based hiding relies on these attributes. If this ever matters,
  give the attributes a per-install random prefix stored in `chrome.storage.local`.
- **Confidence:** High.

### 5. Facebook Reels detection can over-match: Info, open

- **Location:** `content/facebook.js`, `REEL_LINKS` and `containerFor()`.
- **Issue:** any link whose `href` contains `/reel/` or `/reels/` counts as a Reel, including an
  off-site URL such as `https://www.instagram.com/reel/…` shown un-wrapped in a post. The whole
  post containing it is then hidden.
- **Impact:** over-blocking (a post disappears), with no security impact. The extension still
  only sets an attribute.
- **Fix (recommended):** resolve the link and require a Facebook host, e.g.
  `new URL(link.href).hostname.endsWith("facebook.com")`, before hiding. This was not applied
  because it changes which posts get hidden on real Facebook markup, which the stand-in test pages
  cannot check.
- **Confidence:** Medium. Facebook usually routes outbound links through `l.facebook.com/l.php`,
  where the path is encoded.

### 6. Synthetic clicks are handled like real ones: Info, no action

- **Location:** `content/youtube.js`, click listener.
- **Issue:** the listener doesn't check `event.isTrusted`, so a page script can dispatch a click
  on a Shorts link and trigger the redirect.
- **Impact:** none. The page could navigate itself to the same URL directly. Content scripts run
  in an isolated world, so page scripts can't reach `chrome.*` APIs or the script's variables.
- **Confidence:** High.

### 7. Settings stored in `chrome.storage.sync`: Info, no action

- **Location:** `settings.js`, `popup/popup.js`.
- **Issue:** the four booleans in `RSB_DEFAULTS` are kept in `chrome.storage.sync`. If the user
  has browser sync on, the browser syncs them to the user's account. Nothing else is stored.
- **Impact:** none beyond what the privacy policy states. Values read back are only used as
  booleans (`setAttribute` with an empty value, `input.checked`).
- **Confidence:** High.

## Checks with no findings

- **Injection sinks:** no `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`,
  `eval`, `new Function` or string-form `setTimeout`. DOM writes are limited to
  `setAttribute`/`removeAttribute` with constant names and empty values.
- **Remote code:** none. All scripts are bundled, and `popup.html` loads only local files with no
  inline script.
- **Network and data collection:** no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`,
  analytics or telemetry. The only URLs the code builds are same-origin navigations
  (`/watch?v=<id>` and `/`).
- **Messaging:** no `runtime.sendMessage`, `onMessage` or `postMessage`. Pages have no channel
  into the extension.
- **Secrets:** none in the tree or git history. `.gitignore` already excludes `*.pem`, `*.crx`
  and `*.zip`.

## Dependencies

The extension has no runtime dependencies and no package manager manifest (`package.json`,
lockfile), so there is nothing for `npm audit` or similar tools to check. The smoke test
(`tests/smoke.js`) uses Playwright as a developer-only tool that is installed separately and never
shipped in the extension. Keep it out of the extension folder, because Chrome refuses to load an
unpacked extension containing any file or directory whose name starts with `_`, which
`node_modules` trees often do.

## Other observations (not security)

- `content/youtube.css` uses `:has()`, which needs Chrome 105 or later. Consider adding
  `"minimum_chrome_version": "105"` to `manifest.json` so older browsers don't install a version
  that silently does nothing.
- The Shorts click handler ignores Ctrl, Cmd and Shift clicks but not Alt-click, which Chrome uses
  to download a link.
