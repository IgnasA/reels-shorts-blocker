# Reels & Shorts Blocker

A browser extension (Manifest V3) that hides YouTube Shorts and Facebook Reels and keeps you out of
their endless-scroll players. Each feature can be switched on or off from the toolbar popup, and
changes apply to open tabs immediately.

## What it does

**YouTube**
- Hides Shorts shelves; Shorts in search, home, subscriptions and the watch-page sidebar; the
  Shorts sidebar entry; the channel "Shorts" tab; and the "Shorts" search filter
- Opens any `/shorts/<id>` link in the normal `/watch?v=<id>` player

**Facebook**
- Hides Reels feed posts and "Reels" shelves, the Reels sidebar entry and Reels tabs
- Redirects `facebook.com/reel/...` and `facebook.com/reels/...` pages to the home feed

The extension makes no network requests and collects no data. It stores only its four on/off
settings. See [docs/PRIVACY_POLICY.md](docs/PRIVACY_POLICY.md).

## Supported platforms

| | Status |
|---|---|
| Google Chrome 105+ (desktop) | Supported. 105 is the first version with CSS `:has()`, which the YouTube rules rely on. |
| Other Chromium browsers (Edge, Brave, Opera, Vivaldi) | Should work with **Load unpacked**, but not tested |
| Firefox, Safari | Not supported |
| Mobile browsers | Not supported (mobile Chrome has no extensions) |
| youtube.com (desktop) and m.youtube.com | Supported |
| facebook.com (desktop) | Supported. Other facebook.com subdomains get the same script but aren't specifically targeted. |

## Install from source

1. Clone or download this repository.
2. Open `chrome://extensions` (in Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
5. Optionally, pin the extension from the puzzle-piece menu to reach the popup.

To update, pull the latest changes and click the reload icon on the extension's card.

## How blocking works

Each site has a content script that runs at `document_start` and sets a flag attribute on
`<html>`, such as `data-rsb-yt-shorts`, when its setting is on. The site's stylesheet hides Shorts
or Reels only while that flag is set, so turning a setting off makes everything reappear at once.

- **YouTube** uses stable element names, so hiding is mostly plain CSS in `content/youtube.css`.
  The script also marks the "Shorts" filter chip, which can only be found by its text, and
  rewrites Shorts links and URLs to `/watch?v=<id>`.
- **Facebook** obfuscates its markup, so `content/facebook.js` finds Reels by their `/reel/` and
  `/reels/` links and marks the surrounding post, shelf or menu item for `content/facebook.css`
  to hide. It also redirects Reels pages to `/`.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the details.

## Develop and test

There is no build step. Edit the files, then click the reload icon on the extension's card in
`chrome://extensions` and refresh the YouTube or Facebook tab.

```
manifest.json      extension manifest
settings.js        defaults and storage helpers shared by the content scripts and the popup
content/           per-site content scripts and stylesheets
popup/             toolbar popup
tests/smoke.js     end-to-end smoke test
docs/              architecture, security review, privacy policy
```

**Automated smoke test.** `tests/smoke.js` loads the unpacked extension in Chromium through
Playwright and serves small stand-in YouTube and Facebook pages, so it needs no network access or
accounts. It checks hiding, both redirects, that off-site links aren't rewritten, and that the
popup toggles take effect in open tabs.

```sh
npm install -g playwright             # once; keep node_modules out of the extension folder
npx playwright install chromium       # once, if you don't already have Playwright's Chromium
node tests/smoke.js
```

Set `CHROMIUM_PATH=/path/to/chromium` to use a specific Chromium build. Branded Google Chrome
ignores `--load-extension` since version 137, so use Playwright's Chromium.

**Manual check on the real sites.** The stand-in pages can't catch the real sites' markup
changing, so before a release also check by hand:

- YouTube home, subscriptions, search and a watch page show no Shorts. The sidebar has no Shorts
  entry, and channel pages have no Shorts tab.
- Opening `youtube.com/shorts/<id>` lands on `/watch?v=<id>`.
- The Facebook feed shows no Reels posts or shelf, and `facebook.com/reel/<id>` goes to the feed.
- Turning each popup toggle off brings back the matching content without a page reload.

If something slips through, the selectors to update are in `content/youtube.css`, and in
`REEL_LINKS` and `containerFor()` in `content/facebook.js`.

**Packaging for a store.** Zip only the files the extension needs:

```sh
zip -r reels-shorts-blocker.zip manifest.json settings.js content popup icons
```

## Security

See [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) for the latest security and privacy
review.
