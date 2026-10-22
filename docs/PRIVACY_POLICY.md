# Privacy Policy: Reels & Shorts Blocker

_Last updated: 2026-10-21_

Reels & Shorts Blocker is a browser extension that hides YouTube Shorts and Facebook Reels. This
policy describes what the extension does with data. It is based on the extension's source code,
which is public at <https://github.com/ignasa/reels-shorts-blocker>.

## Summary

The extension **does not collect, transmit, sell or share any personal data**. It makes no
network requests of its own and contains no analytics, tracking or advertising code.

## What the extension accesses

To do its job, the extension runs on pages at `youtube.com` and `facebook.com` (over HTTPS) and
does the following, entirely inside your browser:

- **Page content and addresses.** It reads the page's address and the links on the page to
  recognise Shorts and Reels, and adds attributes to the page so those items are hidden. It does
  not read what you type, your messages, your account details, or anything else on the page.
- **Navigation.** If you open a YouTube Shorts link, it sends you to the same video in YouTube's
  normal player instead. If you open a Facebook Reels page, it sends you to the Facebook home feed.
  You can turn each of these off in the extension's popup.

Nothing the extension reads from these pages is saved or sent anywhere.

## What the extension stores

The extension stores only your settings: four on/off switches (hide Shorts, redirect Shorts,
hide Reels, block Reels pages). They are saved with the browser's extension storage
(`chrome.storage.sync`). If you have turned on sync in your browser, the browser syncs these
switches to your browser account so they follow you to your other devices. That syncing is done
by your browser vendor (for example Google, for Chrome) under its own privacy policy. The
extension's author never receives these settings.

The extension stores no browsing history, page content, identifiers or other personal data.

## Permissions

- **`storage`**: saves the four settings described above.
- **Access to youtube.com and facebook.com**: lets the extension hide Shorts and Reels on those
  sites. It does not run on any other website.

## Third parties

The extension sends no data to the author or to any third party. It does not load remote code.

## Children

The extension collects no data from anyone, including children.

## Changes to this policy

If what the extension does with data ever changes, this policy will be updated and the "Last
updated" date above will change.

## Contact

Questions about this policy can be raised as an issue at
<https://github.com/ignasa/reels-shorts-blocker/issues>.
