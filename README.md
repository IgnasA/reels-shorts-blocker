# Reels & Shorts Blocker

A browser extension (Manifest V3) that hides YouTube Shorts, Facebook Reels and Instagram Reels and
keeps you out of their endless-scroll players. Each feature can be switched on or off from the
toolbar popup, and changes apply to open tabs immediately.

## What it does

**YouTube**
- Hides Shorts shelves; Shorts in search, home, subscriptions and the watch-page sidebar; the
  Shorts sidebar entry; the channel "Shorts" tab; and the "Shorts" search filter
- Opens any `/shorts/<id>` link in the normal `/watch?v=<id>` player
- Sends a channel's Shorts tab (`/@name/shorts`) to its Videos tab

**Facebook**
- Hides Reels feed posts and "Reels" shelves, the Reels sidebar entry and Reels tabs
- Redirects `facebook.com/reel/...`, `/reels/...` and `/share/r/...` pages to the home feed

**Instagram**
- Hides Reels posts in the feed, Reels tiles in Explore and profile grids, the Reels nav entry and
  the profile "Reels" tab
- Opens any `/reel/<code>` link as a normal post (`/p/<code>`), without the swipe-to-next Reels
  player
- Sends the Reels feed (`/reels/`) to the home feed and a profile's Reels tab to the profile

The extension makes no network requests and collects no data. It stores only its six on/off
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
| instagram.com (desktop) | Supported |

## Install from source

1. Clone or download this repository.
2. Open `chrome://extensions` (in Edge: `edge://extensions`).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the repository folder (the one containing `manifest.json`).
   If you have run `npm install`, load `dist/extension` from `npm run package` instead, so
   `node_modules` isn't loaded with it.
5. Optionally, pin the extension from the puzzle-piece menu to reach the popup.

To update, pull the latest changes and click the reload icon on the extension's card.

## How blocking works

Each site has a content script that runs at `document_start` and sets a flag attribute on
`<html>`, such as `data-rsb-yt-shorts`, when its setting is on. The site's stylesheet hides Shorts
or Reels only while that flag is set, so turning a setting off makes everything reappear at once.

- **YouTube** uses stable element names, so hiding is mostly plain CSS in `content/youtube.css`.
  The script also marks the "Shorts" filter chip, which can only be found by its text, and
  rewrites Shorts links and URLs to `/watch?v=<id>`.
- **Facebook** and **Instagram** obfuscate their markup, so `content/facebook.js` and
  `content/instagram.js` find Reels by their links and mark the surrounding post, shelf, tab or
  menu item for the matching stylesheet to hide. They also redirect Reels pages.

Redirects wait for the stored settings, so switching a redirect off always takes effect, even on
the first page load. The URL rules live in `urls.js`. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
for the details and [docs/SELECTORS.md](docs/SELECTORS.md) for every rule, when it was last checked
against the live sites, and how likely it is to break.

## Develop and test

There is no build step and no runtime dependency. Edit the files, then click the reload icon on the
extension's card in `chrome://extensions` and refresh the site's tab.

```
manifest.json      extension manifest
settings.js        defaults, storage and URL-change helpers shared by the scripts and the popup
urls.js            the Shorts/Reels URL rules
content/           per-site content scripts and stylesheets
popup/             toolbar popup
icons/             extension icons (16, 32, 48, 128 px)
scripts/           packaging script for the store zip
test/              unit, jsdom and browser tests, with fixture pages in test/fixtures/
tests/smoke.js     end-to-end smoke test
docs/              architecture, selectors, security review, privacy policy
store/             Chrome Web Store listing copy, privacy answers, images, submission guide
```

Node 22 is only needed for the tests and packaging:

```sh
npm install
npx playwright install chromium   # skip if a Playwright Chromium is already installed
npm test                          # unit, jsdom, manifest and browser tests
npm run test:smoke                # end-to-end smoke test
npm run package                   # dist/reels-shorts-blocker-<version>.zip for the store
```

- `test/*.test.js` covers the URL rules, the manifest's store requirements, and each content script
  in [jsdom](https://github.com/jsdom/jsdom) with a fake `chrome.storage` and `location`
  (`test/helpers.js`).
- The browser tests (`test/youtube.test.js`, `test/facebook.test.js`,
  `test/instagram.browser.test.js`) load the packaged extension into Chromium and answer every
  youtube.com/facebook.com/instagram.com request with a page from `test/fixtures/`, so they run
  offline. When a site changes its markup, update the fixture to match before fixing the rule.
- `tests/smoke.js` runs a short end-to-end pass with inline stand-in pages, including that off-site
  links aren't rewritten and that popup toggles reach open tabs.

Branded Google Chrome ignores `--load-extension` since version 137, so the tests use Playwright's
Chromium. Set `CHROMIUM_PATH=/path/to/chromium` to run the smoke test with a specific build.

**Manual check on the real sites.** The fixture pages can't catch the real sites' markup changing,
so before a release also check by hand, logged in:

- YouTube home, subscriptions, search and a watch page show no Shorts. The sidebar has no Shorts
  entry, and channel pages have no Shorts tab. Opening `youtube.com/shorts/<id>` lands on
  `/watch?v=<id>`.
- The Facebook feed shows no Reels posts or shelf, and `facebook.com/reel/<id>` goes to the feed.
- The Instagram feed, Explore and a profile show no Reels, and `instagram.com/reel/<code>` opens
  as `/p/<code>/`.
- Turning each popup toggle off brings back the matching content without a page reload.

If something slips through, the selectors to update are in `content/youtube.css`, `REEL_LINKS`
and `containerFor()` in `content/facebook.js`, and `IG_REEL_LINKS` and `igContainerFor()` in
`content/instagram.js`.

## Publishing

`npm run package` builds the upload zip. Everything else for the Chrome Web Store (listing copy,
privacy-tab answers, screenshots, promo tile and a step-by-step guide) is in [store/](store/); start
with [store/SUBMISSION_GUIDE.md](store/SUBMISSION_GUIDE.md).

## Security

See [docs/SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) for the latest security and privacy
review.
