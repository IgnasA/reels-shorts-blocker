# Privacy practices tab: answers

Answers for the **Privacy practices** tab of the Chrome Web Store developer dashboard, based on
what the code in this release actually does (`manifest.json`, `settings.js`, `urls.js`,
`content/*.js`, `popup/*.js`). If the code changes, re-check every answer here.

## Single purpose description

```
Reels & Shorts Blocker removes short-form video feeds (YouTube Shorts, Facebook Reels and Instagram Reels) from those websites so users can browse them without being pulled into endless short-video scrolling. It hides Shorts and Reels from pages and opens individual Shorts and reels as regular videos or posts. Every feature can be switched on or off from the toolbar popup.
```

All features (hiding and redirecting on three sites) serve this one purpose, which is what the
single-purpose policy asks for.

## Permission justifications

The manifest requests one API permission and no `host_permissions` field. Its content scripts run
on three sites, which the dashboard treats as host permissions and asks you to justify.

**`storage`**

```
Saves the user's on/off choices from the extension's popup (six switches, for example "Hide Shorts" or "Open reels as normal posts") with chrome.storage.sync, so the content scripts can apply them and they persist between browser sessions. Nothing else is stored.
```

**Host permissions** (content scripts on `https://*.youtube.com/*`, `https://*.facebook.com/*`,
`https://*.instagram.com/*`)

```
The extension's content scripts must run on these three sites to do its single purpose: they hide YouTube Shorts, Facebook Reels and Instagram Reels from the page and redirect Shorts and Reels page addresses to the regular video or post. Access is limited to HTTPS pages on these three domains only. The scripts read the page address and links on the page to recognise Shorts and Reels, and only add attributes to the page to hide them. They do not read form input, messages or account details, and nothing is sent anywhere.
```

If the dashboard shows separate boxes for `activeTab`, `scripting`, `tabs` or other permissions,
those don't apply: the extension doesn't request them.

## Remote code

**Are you using remote code?** → **No, I am not using remote code.**

Justification (if asked):

```
All JavaScript and CSS is included in the extension package. The extension makes no network requests, does not use eval() or new Function(), and loads no external scripts, styles or modules. The default Manifest V3 content security policy applies.
```

The tests enforce this (`test/manifest.test.js`, "shipped scripts parse and contain no remote or
dynamic code").

## Data usage

**What user data do you plan to collect from users now or in the future?** → tick **none** of the
boxes:

| Data type | Tick? | Why |
|---|---|---|
| Personally identifiable information | No | Never accessed |
| Health information | No | Never accessed |
| Financial and payment information | No | Never accessed |
| Authentication information | No | Never accessed |
| Personal communications | No | Never accessed |
| Location | No | Never accessed |
| Web history | No | The scripts check the current page's address to decide whether to redirect, but don't record, store or send it |
| User activity | No | Clicks on Shorts links are intercepted only to open the normal player; nothing is recorded |
| Website content | No | Links on the page are read in the browser to recognise Shorts and Reels; nothing is stored or sent |

Why "none" is accurate: the extension has no server and makes no network requests, so no data
ever leaves the user's browser or reaches the developer. What it handles locally:

- **Settings:** six booleans in `chrome.storage.sync`. If the user has Chrome sync on, Chrome syncs
  them through the user's Google account; the developer never receives them. These are the
  user's preferences for the extension, not user data in the policy's sense.
- **Instagram loop guard:** `content/instagram.js` keeps one record in the Instagram tab's
  `sessionStorage` (`rsb-ig-redirect`: the `/p/<code>/` address it last redirected to and a
  timestamp) to stop a redirect loop. It stays in that tab and is deleted when the tab closes.
  The privacy policy discloses it.

This rests on reading "collect" as data leaving the user's device or reaching the developer,
which is how the Chrome Web Store's user data policy and FAQ are generally applied; check the
current FAQ wording when you fill the form. If you'd rather be maximally conservative, you could tick **Website content** and
**Web history** and explain that both are processed only on the device, but that would
misdescribe the extension to users as collecting data, which it doesn't.

## Certifications

Tick all three:

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

All three are true: the extension collects no user data at all.

## Privacy policy URL

```
https://github.com/IgnasA/reels-shorts-blocker/blob/main/docs/PRIVACY_POLICY.md
```

This URL only works once this release branch has been merged into `main`. Open it in a private
window before pasting it to check that it loads without a GitHub login (the repository must be
public).
