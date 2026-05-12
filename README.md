<p align="center"><img src="images/suite/banner.png" alt="Wick Suite"></p>

# Wick Suite

> A suite of precision addons for serious TBC Classic raiders. One locked palette, one voice, one chrome.

This repo holds the **brand assets** for the Wick addon suite — not a WoW addon itself. Drop it in your `AddOns` directory if you like (WoW ignores folders without a `.toc`), or keep it anywhere else.

## The suite

<!-- wick:suite-table:start -->
| Addon | GitHub | CurseForge |
|---|---|---|
| **Wick's TBC BIS Tracker** | [repo](https://github.com/Wicksmods/WickidsTBCBISTracker) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-tbc-bis-tracker) |
| **Wick's CD Tracker** | [repo](https://github.com/Wicksmods/WicksCDTracker) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-cd-tracker) |
| **Wick's Trade Hall** | [repo](https://github.com/Wicksmods/WicksTradeHall) | [CurseForge](https://www.curseforge.com/wow/addons/trade-hall) |
| **Wick's Macro Builder** | [repo](https://github.com/Wicksmods/WicksMacroBuilder) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-macro-builder) |
| **Wick's Combat Log** | [repo](https://github.com/Wicksmods/WicksCombatLog) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-combat-log) |
| **Wick's Stats** | [repo](https://github.com/Wicksmods/WicksStats) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-stats) |
| **Wick's Quest Key** | [repo](https://github.com/Wicksmods/WicksQuestKey) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-quest-key) |
| **Wick's Layers** | [repo](https://github.com/Wicksmods/WicksLayers) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-layers) |
| **Wick's Totems and Things** | [repo](https://github.com/Wicksmods/WicksTotemsAndThings) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-totems-and-things) |
| **Wick's Bags** | [repo](https://github.com/Wicksmods/WicksBags) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-bags) |
| **Wick's Travel Form** | [repo](https://github.com/Wicksmods/WicksTravelForm) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-travel-form) |
| **Wick's Wardrobe** | [repo](https://github.com/Wicksmods/WicksWardrobe) | [CurseForge](https://www.curseforge.com/wow/addons/wicks-wardrobe) |

**Community:** [Discord](https://discord.gg/GWGTMhYBZY)
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
