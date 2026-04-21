# Brand Identity

## Palette (locked)

| Token | Hex | Role |
|---|---|---|
| Fel Green | `#4FC778` | Primary accent · L-brackets · active states · links |
| Void | `#0D0A14` | Panel background · page canvas |
| Shadow | `#171124` | Header strip · secondary panels |
| Muted Purple | `#383058` | 1px borders · dividers |
| Off-White | `#D4C8A1` | Primary text |

Do not drift. Every Wick addon uses the same five values (hex-exact).

## Chrome

- **L-bracket corners** in fel green — **10px arms, 2px thick**, flush to the corner with zero offset.
- **1px muted-purple border** on every panel.
- **Flat panels.** No gradients, no Blizzard dialog textures.
- On resizable frames the BOTTOMRIGHT bracket doubles as the resize grip.

## Typography

- **Display** — Cinzel 700–900 on the web, `Fonts\FRIZQT__.TTF` in-game.
- **UI / body** — Space Grotesk 400–600 on the web, `Fonts\FRIZQT__.TTF` at 11pt in-game.
- **Mono / labels** — Space Mono 400 on the web, `Fonts\ARIALN.TTF` (Arial Narrow) at 9pt in-game.

## Naming convention

Formula: **`Wick's`** + `[Function]` + `[Noun]`

- Always possessive "Wick's" — never bare "Wick".
- Function noun: two words max, literal (no fantasy puns).
- No abbreviations in the display Title (CD is OK in-game shorthand; "Wick CD Tracker" is not a valid display title — must be "Wick's CD Tracker").

Current lineup:
- **Wick's TBC BIS Tracker** (folder `WickidsTBCBISTracker` — legacy CurseForge slug)
- **Wick's CD Tracker** (folder `WicksCDTracker`)
- **Wick's Trade Hall** (folder `WicksTradeHall`)

## Logomark

Teardrop flame with radiating opacity layers and a wick dot at the base, flanked by fel-green L-brackets. SVG source is `logo.svg` in this repo (and mirrored into each addon's folder).

For in-game use (texture backgrounds), convert to `.tga` or `.blp`.
