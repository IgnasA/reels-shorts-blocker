# Reels & Shorts Blocker

Chrome extension (Manifest V3) that hides YouTube Shorts and Facebook Reels.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and pick this folder

## What it does

**YouTube**
- Hides Shorts shelves, Shorts in search/home/subscriptions/sidebar, the Shorts sidebar entry, the channel "Shorts" tab and the "Shorts" search filter
- Opens any `/shorts/<id>` link in the normal `/watch?v=<id>` player
- Sends a channel's Shorts tab (`/@name/shorts`) to its Videos tab

**Facebook**
- Hides Reels feed posts and "Reels" shelves, the Reels sidebar entry and Reels tabs
- Redirects `facebook.com/reel/...`, `/reels/...` and `/share/r/...` pages to the home feed

Each option can be switched off from the toolbar popup; changes apply to open tabs immediately.

## Files

- `content/youtube.css`: YouTube hiding rules, active while `<html data-rsb-yt-shorts>` is set
- `content/youtube.js`: sets that flag, hides the filter chip, handles redirects
- `content/facebook.js`: finds Reels by their links and marks the containing block hidden
- `settings.js`: defaults, storage and URL-change helpers shared by the scripts and popup
- `urls.js`: the Shorts/Reels URL rules

If YouTube or Facebook changes its layout and something slips through, the selectors in
`content/youtube.css` and `containerFor()` in `content/facebook.js` are where to look.
`docs/SELECTORS.md` lists every rule, when it was last checked against the live sites,
and how likely it is to break.

## Development

The extension has no build step and no runtime dependencies. Node 22 is only needed
for the tests and packaging:

```sh
npm install
npx playwright install chromium   # skip if a Playwright Chromium is already installed
npm test                          # unit, manifest and browser tests
npm run package                   # dist/reels-shorts-blocker-<version>.zip for the store
```

The browser tests load the packaged extension into Chromium and answer every
youtube.com/facebook.com request with a page from `test/fixtures/`, so they run
offline. When a site changes its markup, update the fixture to match before fixing
the rule.

`docs/STORE_CHECKLIST.md` lists what's left before publishing to the Chrome Web Store.
