# Store listing: copy ready to paste

Everything here goes into the **Store listing** tab of the Chrome Web Store developer dashboard.
The dashboard's description field is plain text, so paste the blocks below as they are (no
Markdown).

## Name (max 75 characters)

```
Reels & Shorts Blocker
```

22 characters. The dashboard takes the name from `manifest.json`, so it already matches.

## Summary (max 132 characters)

```
Hides YouTube Shorts, Facebook Reels and Instagram Reels, and opens single Shorts and reels as normal videos.
```

109 characters. This is the manifest `description`, which the store shows as the summary; it is
not edited in the dashboard. Change it in `manifest.json` if you want different wording (the
tests check the 132-character limit).

## Description

```
Reels & Shorts Blocker hides short-form video feeds so you can watch what you came for without getting pulled into an endless scroll.

WHAT IT DOES

On YouTube:
• Hides the Shorts shelf and Shorts videos on the home page, in subscriptions, in search and next to the video you're watching
• Hides the Shorts entry in the sidebar, the Shorts tab on channel pages and the Shorts search filter
• Opens a Shorts link in the normal video player instead of the swipe-to-next Shorts player
• Sends a channel's Shorts tab to its Videos tab

On Facebook:
• Hides Reels posts and "Reels and short videos" shelves in the feed, the Reels menu entry and Reels tabs
• Sends Reels pages (including shared Reels links) back to your feed

On Instagram:
• Hides Reels posts in the feed, Reels tiles in Explore and on profiles, the Reels menu entry and the profile Reels tab
• Opens a single reel as a normal post, without the swipe-to-next Reels player
• Sends the Reels feed back to your home feed

Everything else on these sites, including regular videos and posts, stays exactly as it was.

HOW TO USE IT

Click the extension's icon in the Chrome toolbar (pin it from the puzzle-piece menu to keep it visible). The popup has one switch per feature, grouped by site. Every switch is on by default. Flip a switch and the change applies straight away to the tabs you already have open, with no reload.

PRIVACY

Reels & Shorts Blocker collects no data. It makes no network requests, has no analytics, tracking or ads, and loads no remote code. It only runs on youtube.com, facebook.com and instagram.com, where it looks at the page address and links to recognise Shorts and Reels, entirely inside your browser. The only thing it saves is your on/off switches, in Chrome's extension storage (synced by Chrome if you have sync turned on). Full privacy policy: https://github.com/IgnasA/reels-shorts-blocker/blob/main/docs/PRIVACY_POLICY.md

OPEN SOURCE

The source code is public at https://github.com/IgnasA/reels-shorts-blocker. Report problems or a Short or Reel that slipped through at https://github.com/IgnasA/reels-shorts-blocker/issues.

Websites change their layouts from time to time. If something starts showing up again, please open an issue so the rules can be updated.

Reels & Shorts Blocker is an independent project. It is not affiliated with or endorsed by Instagram, Meta, YouTube or Google. YouTube and YouTube Shorts are trademarks of Google LLC; Facebook, Instagram and Reels are trademarks of Meta Platforms, Inc. They are named here only to describe which sites the extension works on.
```

## Category and language

- **Category:** Lifestyle › **Well-being** (it's a digital-wellbeing tool). A reasonable
  alternative is Productivity › **Tools**. The category doesn't affect review.
- **Language:** English (United States). The popup and description are English only.

## Images

| Dashboard field | File | Notes |
|---|---|---|
| Store icon (128×128) | `icons/icon128.png` | 96×96 artwork with 16 px of transparent padding, as the image guidelines ask |
| Screenshots (1280×800, up to 5) | `store/screenshots/1-popup.png`, `2-youtube.png`, `3-facebook.png`, `4-instagram.png` | Upload in this order; the first one is the listing's lead image |
| Small promo tile (440×280) | `store/promo-tile-440x280.png` | Required |
| Marquee promo tile (1400×560) | none | Optional; only used if Google features the extension |

The screenshots show the real extension running in Chromium, but on **made-up stand-in pages**
(`store/src/*.html`) that mimic each site's layout with invented accounts and no logos, so they
contain no real people's content. You may want to swap in screenshots of the real sites taken
with your own account. If you do, avoid showing other people's names, faces or posts, and crop out
the sites' logos. Run `npm run store:images` to re-render these after changing the popup or the
stand-in pages.

## Other listing fields

- **Official URL / Homepage URL:** `https://github.com/IgnasA/reels-shorts-blocker`
- **Support URL:** `https://github.com/IgnasA/reels-shorts-blocker/issues`
- **Mature content:** No.

## Trademark and logo check

Using another company's trademarks in a way that suggests a connection is one of the most common
reasons extensions get rejected or later taken down (policy: *Impersonation or intellectual
property*). What was checked, and what's left for you to decide:

| Item | Risk | Notes |
|---|---|---|
| **Icon** | **Medium. Your call before submitting.** | The icon is a red rounded square with a white play triangle, crossed out. Even with the slash, that is close to YouTube's own logo (white play button on a red rounded rectangle). A reviewer or Google's brand team could see it as using YouTube's logo. The lowest-risk fix is to change the colour (for example charcoal, purple or teal) and/or the glyph (for example a crossed-out vertical phone-shaped frame), then re-run `npm run store:images` so the promo tile and screenshots pick it up. Many approved extensions in this niche use similar red icons, so it may well pass as is, but this is the single most likely trademark objection in this package. |
| Name "Reels & Shorts Blocker" | Low | "Reels" and "Shorts" are feature names of Meta and YouTube, used here descriptively for what gets blocked. The name doesn't contain "YouTube", "Facebook", "Instagram", "Meta" or "Google", which is where most name rejections come from. Don't add them to the name (for example "YouTube Shorts Blocker"). |
| Description | Low | Names the three sites only to say where the extension works (nominative use), once per site in the feature list plus the privacy note, with no keyword stuffing. Ends with the "not affiliated with or endorsed by" disclaimer and a trademark notice. |
| Screenshots | Low | Stand-in pages with no logos, wordmarks or brand colours of the sites; the sites are named only in the captions. The popup's section headings ("YouTube", "Facebook", "Instagram") are plain text. |
| Promo tile | Low | Uses only the extension's own icon, name and colours. No Meta or Google logos. Carries the same icon caveat as above. |
