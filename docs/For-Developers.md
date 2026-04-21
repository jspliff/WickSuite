# For Developers

## Writing a new Wick addon

If you're building a new addon to join the suite, follow the conventions.

### 1. Folder naming

- Follow `Wicks[Noun]` (no apostrophe — filesystems). Example: `WicksRaidTools`.
- Display Title in `.toc` is `Wick's [Function] [Noun]` — possessive with apostrophe.

### 2. Color constants block

Copy this verbatim into the top of your `UI.lua`:

```lua
-- Wick brand palette (locked)
-- Fel #4FC778 · Void #0D0A14 · Shadow #171124 · Border #383058 · Text #D4C8A1
local C_BG          = { 0.051, 0.039, 0.078, 0.97 }
local C_HEADER_BG   = { 0.090, 0.067, 0.141, 1 }
local C_BORDER      = { 0.220, 0.188, 0.345, 1 }
local C_GREEN       = { 0.310, 0.780, 0.471, 1 }
local C_TEXT_NORMAL = { 0.831, 0.784, 0.631, 1 }
```

### 3. Chrome helpers

Use the existing `AddBorder` and `AddCornerAccents` helpers from any sibling addon — they're identical across the suite. If you change one, update all three.

### 4. Logo

Drop `logo.svg` in the addon root. For in-game texture use, convert to `.tga`.

### 5. License

- `LICENSE` = MIT, plus trademark carve-out (see `LICENSE` in any sibling addon for the exact wording).

### 6. Changelog

- `CHANGELOG.md` — newest version on top, Keep-a-Changelog style.

### 7. README

Link to the Wick Suite repo and the other addons in the lineup.

## Architecture patterns (shared across the suite)

- `Core.lua` — namespace on `_G`, saved variables, single event frame that registers all events and dispatches.
- Logic modules (`Scanner.lua`, `Categories.lua`, etc.) — `NS.ModuleName = {}` table with methods called from Core.
- `UI.lua` — themed panels, lazy creation, file-scoped row/element factories.
- `Options.lua` — scrollable settings panel, writes directly to config table.
- `Minimap.lua` — draggable button, left-click toggle, right-click options.
- TOC load order: Core → data/logic modules → UI → Options.

## Updating the brand

Brand token updates flow through the whole suite. The canonical checklist lives in each session's memory as `reference_wick_brand_style.md` — pass that file to the coding agent when requesting a brand change.
