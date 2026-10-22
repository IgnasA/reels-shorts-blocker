# Reels & Shorts Blocker

[![CI](https://github.com/ignasa/reels-shorts-blocker/actions/workflows/ci.yml/badge.svg)](https://github.com/ignasa/reels-shorts-blocker/actions/workflows/ci.yml)

Chrome extension (Manifest V3) that hides YouTube Shorts and Facebook Reels.

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

Each option can be switched off from the toolbar popup; changes apply to open tabs immediately.

## Files

- `content/youtube.css`: YouTube hiding rules, active while `<html data-rsb-yt-shorts>` is set
- `content/youtube.js`: sets that flag, hides the filter chip, handles redirects
- `content/facebook.js`: finds Reels by their links and marks the containing block hidden
- `settings.js`: defaults and storage helpers shared by the scripts and popup

If YouTube or Facebook changes its layout and something slips through, the selectors in
`content/youtube.css` and `containerFor()` in `content/facebook.js` are where to look.
