# Chrome Web Store checklist

## Done in the repo (checked by `npm test`)

- [x] Manifest V3, with name, version, description (≤ 132 characters) and
      `minimum_chrome_version` 105 (needed for CSS `:has()`)
- [x] One permission, `storage`, for the four on/off switches. No
      `host_permissions`, no background worker, no `web_accessible_resources`
- [x] Content scripts only on `*://*.youtube.com/*` and `*://*.facebook.com/*`
- [x] Icons at 16, 48 and 128 px; the toolbar icon at 16 and 48 px
- [x] No remote code: every script and stylesheet ships in the package, and
      there's no `eval`, `new Function`, dynamic `import()` or remote URL
- [x] No data leaves the browser: no network requests, no analytics. The
      switches are kept in `chrome.storage.sync`, which Chrome syncs through
      the user's own Google account
- [x] `npm run package` builds `dist/reels-shorts-blocker-<version>.zip` with
      only the extension files (CI uploads it as a build artifact)

## Needs a person

### Before the first upload
- [ ] **Developer account**: register at the Chrome Web Store developer
      dashboard (one-time fee) and turn on 2-step verification.
- [ ] **Check Facebook while logged in.** Facebook shows no feed logged out,
      so the Reels hiding was only tested against a hand-written fixture (see
      `docs/SELECTORS.md`). Scroll the feed, open Watch, a profile's Reels tab
      and the left sidebar, and check nothing else disappears.
- [ ] **Check YouTube while logged in**: the home and Subscriptions Shorts
      shelves and the full sidebar entry only show for signed-in users.
- [ ] **Try a non-English YouTube** (e.g. `?hl=de`, `?hl=ja`). The search
      filter chip and the full-sidebar entry are matched by the English label
      "Shorts"; decide whether that's acceptable.
- [ ] **Decide the version number** (`manifest.json` is 1.0.0) and bump it
      for every upload after the first.

### Store listing
- [ ] Detailed description (what's hidden, what the switches do, that nothing
      is collected). The README's "What it does" section is a starting point.
- [ ] Category (e.g. "Productivity" or "Tools") and language.
- [ ] At least one screenshot, 1280×800 or 640×400.
- [ ] Small promo tile, 440×280 (required).
- [ ] Store icon: the 128 px icon fills the whole square. Google's guidelines
      ask for about 96×96 artwork with 16 px of transparent padding; consider
      redrawing it so it doesn't look oversized next to other listings.
- [ ] Trademarks: "YouTube", "Shorts", "Facebook" and "Reels" belong to
      Google and Meta. Don't use their logos in the icon or screenshots, and
      consider adding "Not affiliated with YouTube or Facebook" to the
      description. A reviewer could still question the name.

### Privacy practices tab
- [ ] **Single purpose**: "Hides YouTube Shorts and Facebook Reels."
- [ ] **Permission justifications**:
  - `storage`: remembers the user's four on/off switches.
  - Host access (from the content scripts) to youtube.com and facebook.com:
    needed to hide Shorts/Reels on those pages and redirect Shorts/Reels URLs.
- [ ] **Remote code**: "No, I am not using remote code."
- [ ] **Data usage**: tick none of the data types, and certify the three
      statements (no selling, no unrelated use, no creditworthiness use).
- [ ] **Privacy policy URL**: not required when no user data is collected,
      but a one-paragraph page saying so avoids questions. Needs hosting
      somewhere (e.g. GitHub Pages).

### Not done, decide whether you want it
- [ ] Instagram Reels / TikTok support. Each would add a site to the
      install-time permission warning.
- [ ] Facebook profile Reels tab pages (`/<name>/reels`) aren't redirected,
      only hidden as a tab.
- [ ] Edge Add-ons accepts the same zip. Firefox would need a
      `browser_specific_settings.gecko.id` and its own testing.
