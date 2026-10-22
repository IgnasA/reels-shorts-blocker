# Chrome Web Store submission guide

Step-by-step instructions for publishing Reels & Shorts Blocker 1.0.0. Nothing in this repository
has been uploaded or published; every step below is yours to do. This guide replaces the old
`docs/STORE_CHECKLIST.md`.

Files referred to below:

| File | Used for |
|---|---|
| `dist/reels-shorts-blocker-1.0.0.zip` | The upload (built in step 2, not committed) |
| [`listing.md`](listing.md) | Store listing tab: name, summary, description, category, language, URLs, trademark notes |
| [`privacy-tab.md`](privacy-tab.md) | Privacy practices tab: single purpose, permission justifications, remote code, data usage, certifications |
| `screenshots/*.png` | Four 1280×800 screenshots |
| `promo-tile-440x280.png` | Small promo tile |
| `../icons/icon128.png` | Store icon |
| [`../docs/PRIVACY_POLICY.md`](../docs/PRIVACY_POLICY.md) | Privacy policy (public URL below) |

## 0. Before you start

1. **Merge the release PR into `main`.** The privacy policy URL,
   `https://github.com/IgnasA/reels-shorts-blocker/blob/main/docs/PRIVACY_POLICY.md`, only exists
   once `docs/PRIVACY_POLICY.md` is on the default branch. The repository has to be public for
   reviewers and users to open it; check the link in a private window. (If you'd rather not depend
   on GitHub, host the same text on GitHub Pages or your own site and use that URL instead.)
2. **The commits need your sign-off for the DCO check.** They were deliberately left without
   `Signed-off-by` lines, because signing off is your own attestation. Add it yourself, for
   example by squash-merging with a `Signed-off-by: Your Name <you@example.com>` line in the squash
   commit message, or by signing off the commits on the branch before merging.
3. **Decide on the icon.** See the trademark table in [`listing.md`](listing.md#trademark-and-logo-check).
   The current red icon with a white play triangle resembles YouTube's logo. If you change it,
   replace `icons/icon16.png`, `icon32.png`, `icon48.png` and `icon128.png` (128 with 16 px of
   transparent padding) and `store/src/icon-artwork.png`, then run `npm run store:images`.
4. **Check the real sites by hand, logged in** (the automated tests use stand-in pages):
   - YouTube home, Subscriptions, search and a watch page: no Shorts; no Shorts sidebar entry or
     channel Shorts tab; `youtube.com/shorts/<id>` opens as `/watch?v=<id>`.
   - Facebook feed: no Reels posts or shelf; `facebook.com/reel/<id>` goes to the feed. Also open
     Watch, a profile and the left sidebar and check nothing else disappeared.
   - Instagram feed, Explore and a profile: no Reels; `instagram.com/reel/<code>` opens as
     `/p/<code>/`.
   - Each popup switch turned off brings its content back without a reload.
   - Optional: try a non-English YouTube (`?hl=de`). The Shorts search chip is matched by the
     English label "Shorts", so it may show in other languages; the rest is language-independent.
   `docs/SELECTORS.md` explains which rules are fragile and where to fix them.

## 1. Register a developer account (one time)

1. Go to the Chrome Web Store developer dashboard: <https://chrome.google.com/webstore/devconsole>.
   Sign in with the Google account that should own the listing. Consider a dedicated account
   rather than your personal one; transferring items later is awkward.
2. Accept the developer agreement and pay the one-time registration fee (US$5 at the time of
   writing).
3. Turn on **2-Step Verification** for that Google account. The dashboard requires it before you
   can publish.
4. In **Account**, set the publisher (display) name and a **contact email**, and verify the email.
   Items can't be published until the contact email is verified.
5. Optional: verify a website you own if you want the listing to show a verified publisher.

## 2. Build the zip

```sh
npm install
npm test            # unit, jsdom, manifest and browser tests; all must pass
npm run package     # writes dist/reels-shorts-blocker-1.0.0.zip
```

The zip contains only the runtime files: `manifest.json`, `settings.js`, `urls.js`, `content/`,
`popup/` and `icons/` (19 files, about 25 KB unpacked). Tests, docs, `store/`, `scripts/` and
`node_modules/` stay out. `dist/` and `*.zip` are git-ignored, so the zip is never committed.

Quick sanity check before uploading: open `chrome://extensions`, turn on Developer mode, click
**Load unpacked**, pick `dist/extension/`, and confirm the card shows no errors.

## 3. Create the item and upload

1. In the dashboard, click **New item** (or **Add new item**).
2. Upload `dist/reels-shorts-blocker-1.0.0.zip`. The dashboard reads the name, version (1.0.0),
   summary and icon from the manifest. Every later upload needs a higher version in
   `manifest.json`.

## 4. Store listing tab

Copy everything from [`listing.md`](listing.md):

- **Description:** the plain-text block (it ends with the not-affiliated disclaimer).
- **Category:** Lifestyle › Well-being (or Productivity › Tools).
- **Language:** English (United States).
- **Store icon:** `icons/icon128.png`.
- **Screenshots:** `store/screenshots/1-popup.png`, `2-youtube.png`, `3-facebook.png`,
  `4-instagram.png`, in that order. They're made-up stand-in pages; swap in real screenshots if
  you prefer (see the notes in `listing.md`).
- **Small promo tile:** `store/promo-tile-440x280.png`. Marquee tile: leave empty.
- **Official URL / Homepage:** `https://github.com/IgnasA/reels-shorts-blocker`.
- **Support URL:** `https://github.com/IgnasA/reels-shorts-blocker/issues`.
- **Mature content:** No.

## 5. Privacy practices tab

Copy everything from [`privacy-tab.md`](privacy-tab.md):

- **Single purpose description.**
- **Permission justifications:** `storage` and the host permissions for the three sites.
- **Remote code:** "No, I am not using remote code."
- **Data usage:** tick no data types, and tick all three certifications.
- **Privacy policy URL:**
  `https://github.com/IgnasA/reels-shorts-blocker/blob/main/docs/PRIVACY_POLICY.md` (works once
  the release PR is merged; see step 0).

## 6. Distribution tab

- **Payments:** free.
- **Visibility:** *Public* for a normal launch. *Unlisted* is a good option if you want to try the
  store build yourself first: anyone with the link can install it, but it doesn't show in search.
  You can change visibility later without a new review.
- **Regions:** all regions.

## 7. Test instructions tab (if shown)

Reviewers can test YouTube logged out. Facebook and Instagram show their feeds only to logged-in
users. Don't hand out credentials to a personal account; a short note is enough:

```
No account is needed for the extension itself. On YouTube, open https://www.youtube.com/results?search_query=cooking (no Shorts shelf or Shorts filter is shown) and https://www.youtube.com/shorts/<any id> (opens in the normal player at /watch?v=<id>). Facebook and Instagram need any logged-in account to show a feed; with the extension on, Reels posts are hidden and /reel/ links open as the feed or a normal post. Each feature can be switched off in the toolbar popup.
```

## 8. Submit for review

1. Click **Submit for review**.
2. In the dialog, consider **unticking "Publish automatically after review"** (deferred
   publishing). You then get time after approval to check the listing and publish it yourself
   with **Publish**.
3. Review usually takes a few days. First submissions from new accounts and extensions that run on
   popular sites can take longer. You'll get an email either way. You can't change a pending
   submission except by cancelling it.

## 9. After approval

- Install the store version on a clean Chrome profile and repeat the checks from step 0.4.
- Optionally tag the merged commit `v1.0.0` and create a GitHub release.
- For every update: bump `version` in `manifest.json`, run `npm test` and `npm run package`, then
  upload the new zip under **Package** and submit again.

## Common rejection reasons and how this package handles them

Rejection emails cite a policy and a reference ID (a colour + element name such as "Purple
Potassium"); the ID tells you which policy area was violated.

| Rejection reason | How this package addresses it |
|---|---|
| **Excessive or unused permissions** (e.g. Purple Potassium) | One API permission, `storage`, which is used. No `host_permissions`, `tabs`, `scripting`, `activeTab`, background worker or `web_accessible_resources`. Content scripts are limited to HTTPS on the three sites. Each permission is justified in `privacy-tab.md`. `test/manifest.test.js` fails if any of this changes. |
| **Privacy disclosures missing or not matching the code** (e.g. Purple Lithium) | `privacy-tab.md` was written from the code: no network requests, settings only in `chrome.storage.sync`, a session-only loop guard on Instagram. The privacy policy says the same and has a public URL. |
| **Remote code** (e.g. Blue Argon) | Everything ships in the zip; no `eval`, `new Function`, dynamic `import()` or remote URLs. Enforced by the manifest test. |
| **Obfuscated code** (e.g. Red Titanium) | Plain, commented source with no build step or minification. |
| **Single purpose** | All features hide or redirect short-form video on three sites; described in one sentence in `privacy-tab.md`. |
| **Misleading or spammy metadata** (e.g. Yellow Zinc) | Description says exactly what is hidden and where, with no keyword lists, no claims about other sites, and no promises the code doesn't keep. Screenshots show the real extension. |
| **Trademark / impersonation** | Disclaimer and trademark notice in the description, no platform logos in the screenshots or promo tile, no brand names in the extension name. The icon's resemblance to YouTube's logo is flagged in `listing.md` for you to decide. |
| **Missing listing assets** | Description, 128 px icon (with the recommended padding), four 1280×800 screenshots and the 440×280 promo tile are all here. |
| **Functionality doesn't work for the reviewer** (e.g. Yellow Magnesium) | The test instructions above tell reviewers what to check and that Facebook/Instagram need a login. Automated tests cover hiding, redirects and the popup switches against fixture pages; the manual checks in step 0 cover the live sites. |
| **Broken package** | `npm run package` ships only runtime files, leaves dotfiles out, and the tests check that every file the manifest references is in the package and that no file name starts with `_` (Chrome refuses those). |

## Not in this release (decide later)

- Firefox would need `browser_specific_settings.gecko.id` and its own testing; Edge Add-ons
  accepts the same zip.
- TikTok support would add a site to the install-time permission warning.
- Facebook profile Reels pages (`/<name>/reels`) are hidden as a tab but not redirected.
