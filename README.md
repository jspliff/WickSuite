<p align="center"><img src="images/wick-banner-suite.png" alt="Wick Suite"></p>

# Wick Suite

> Three precision addons for serious TBC Classic raiders. One locked palette, one voice, one chrome.

This repo holds the **brand assets** for the Wick addon suite — not a WoW addon itself. Drop it in your `AddOns` directory if you like (WoW ignores folders without a `.toc`), or keep it anywhere else.

## The suite

<!-- wick:suite-table:start -->
| Addon | GitHub | CurseForge |
|---|---|---|
| **Wick's TBC BIS Tracker** | [repo](https://github.com/jspliff/WickidsTBCBISTracker) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-tbc-bis-tracker) |
| **Wick's CD Tracker** | [repo](https://github.com/jspliff/WicksCDTracker) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-cd-tracker) |
| **Wick's Trade Hall** | [repo](https://github.com/jspliff/WicksTradeHall) | [CurseForge](https://www.curseforge.com/wow/addons/trade-hall) |
<!-- wick:suite-table:end -->

## Contents

- **`thumbnails.html`** — single-page gallery rendering all 5 store artboards (suite banner 860×320 + 4 thumbnails 460×260). Open in Chrome and screenshot each `.artboard` element via DevTools.
- **`logo.svg`** — full-color Wick logomark (flame over wick base, flanked by fel-green L-brackets). The same file is duplicated into each addon folder for in-repo consistency.
- **`brand-identity.html`** — standalone copy of the one-pager defining the brand system (palette, typography, L-bracket chrome, naming convention, addon lockups).

## Brand tokens

```
Fel Green    #4FC778   primary accent, L-brackets, active states
Void         #0D0A14   panel background
Shadow       #171124   header strip, secondary panels
Muted Purple #383058   1px borders, dividers
Off-White    #D4C8A1   primary text
```

L-bracket chrome: **10px arms, 2px thick, flush to corners.** Flat panels — no gradients, no Blizzard dialog textures.

Naming formula: **`Wick's` + `[Function]` + `[Noun]`** — always possessive, never bare.

## Typography

Web design uses Cinzel (display) / Space Grotesk (UI) / Space Mono (labels). In-game those map to `Fonts\FRIZQT__.TTF` (body/title) and `Fonts\ARIALN.TTF` (mono/status).

## License

- **Code and docs:** MIT — see [`LICENSE`](LICENSE).
- **Brand assets (name, logomark, wordmark, visual system):** trademark-protected — see [`TRADEMARK.md`](TRADEMARK.md) for what you may and may not do with them.

TL;DR: fork the code freely, don't ship your fork as "Wick's" anything.
