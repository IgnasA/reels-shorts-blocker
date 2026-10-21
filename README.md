# Reels & Shorts Blocker

Chrome extension (Manifest V3) that hides YouTube Shorts, Facebook Reels and Instagram Reels.

## Install

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and pick this folder

## What it does

**YouTube**
- Hides Shorts shelves, Shorts in search/home/subscriptions/sidebar, the Shorts sidebar entry, the channel "Shorts" tab and the "Shorts" search filter
- Opens any `/shorts/<id>` link in the normal `/watch?v=<id>` player

**Facebook**
- Hides Reels feed posts and "Reels" shelves, the Reels sidebar entry and Reels tabs
- Redirects `facebook.com/reel/...` pages to the home feed

**Instagram**
- Hides Reels posts in the feed, Reels tiles in Explore and profile grids, the Reels nav entry and the profile "Reels" tab
- Opens any `/reel/<code>` link as a normal post (`/p/<code>`), without the swipe-to-next Reels player
- Sends the Reels feed (`/reels/`) to the home feed and a profile's Reels tab to the profile

Each option can be switched off from the toolbar popup; changes apply to open tabs immediately.

## Files

- `content/youtube.css`: YouTube hiding rules, active while `<html data-rsb-yt-shorts>` is set
- `content/youtube.js`: sets that flag, hides the filter chip, handles redirects
- `content/facebook.js`: finds Reels by their links and marks the containing block hidden
- `content/instagram.js`: the same approach for Instagram, plus the reel-to-post redirect
- `settings.js`: defaults and storage helpers shared by the scripts and popup

If a site changes its layout and something slips through, the selectors in
`content/youtube.css`, `containerFor()` in `content/facebook.js` and `igContainerFor()` in
`content/instagram.js` are where to look.

## Tests

The extension has no build step; `npm` is only used for the tests.

```sh
npm install
npm test
```

The tests run `settings.js` and each content script in [jsdom](https://github.com/jsdom/jsdom)
with a fake `chrome.storage` and `location` (see `test/helpers.js`), and check that the
manifest and popup match the files and settings.
