# Wick Tool

Single CLI for the Wick addon suite pipeline. One command collapses the multi-hour new-addon workflow down to minutes.

```bash
node "C:/Users/jspli/Projects/Wick/WickSuite/tools/wick.mjs" <subcommand> [args]
```

## Subcommands

| Command | Action |
|---|---|
| `wick list` | Print the active addon roster from `wick.json` |
| `wick scaffold "Wick's X Y"` | Create a new addon — folder, files, junction, git, GitHub repo, register in `wick.json` |
| `wick sync` | Regenerate the suite-table cross-link block in every `README.md` (delimited by `<!-- wick:suite-table:start -->` ... `end`) |
| `wick render` | Shortcut to `grab-artboards.mjs` — render all thumbnails + banner (1× and 2× PNGs) |
| `wick release <folder> <ver>` | Version bump → CHANGELOG append → commit + tag + push → zip → upload to CurseForge |

## Config

`WickSuite/wick.json` is the single source of truth. Every subcommand reads from it. Fields:

- `author`, `author_email`, `github_user`
- `cf_api_base`, `cf_game_version_id`, `cf_game_version_type_id`, `interface`
- `addons_root_local` (the real `Interface\AddOns\` path)
- `project_home` (`C:\Users\jspli\Projects\Wick\`)
- `addons[]` — per-addon: `folder`, `title`, `short`, `slash`, `tagline`, `accent`, `accent_name`, `cf_slug`, `cf_project_id`, `features`, `repo`
- `retired[]` — historical record of removed addons (don't recreate without explicit ask)

## Requirements

- **Node 18+** (uses `execSync`, `fs.promises`, ESM)
- **`gh` CLI authenticated** for `scaffold` (repo creation, topic/wiki/discussions enable)
- **`CURSEFORGE_API_TOKEN` env var** for `release` (addon zip upload to CF)
- **Windows** — uses `cmd /c mklink /J` for directory junctions and PowerShell `Compress-Archive` for zipping

## Templates

`WickSuite/templates/new-addon/` — files copied into a new addon on scaffold, with `{{PLACEHOLDER}}` tokens substituted. Placeholders:

- `{{TITLE}}` — "Wick's Aggro Meter"
- `{{FOLDER}}` — "WicksAggroMeter" (no apostrophe, filesystem-safe)
- `{{SHORT}}` — "Aggro Meter"
- `{{SHORT_SLUG}}` — "aggro-meter"
- `{{SLASH}}` — "/wam" (auto-derived from title capitals)
- `{{SLASH_UPPER}}` — "WAM" (used in `SLASH_XX1` global)
- `{{NAMESPACE}}` — "WICKSAGGROMETER" (Lua `_G` namespace)
- `{{SAVEDVARS}}` — "WICKSAGGROMETERDB"
- `{{TAGLINE}}`, `{{CF_SLUG}}`, `{{REPO}}`, `{{YEAR}}`, `{{DATE}}`, `{{FEATURE_BULLETS}}`

## Typical new-addon flow (with `wick`)

```bash
# 1. Scaffold (30 sec) — creates folder, files, GitHub repo, registers in config
wick scaffold "Wick's Aggro Meter"

# 2. Edit Core.lua / UI.lua to implement the addon

# 3. Take in-game screenshots → save to design-handoff/images/screenshot-aggro-meter.png

# 4. Add a <Shot which="aggro"> entry to WickSuite/thumbnails.html

# 5. Render thumbnails (45 sec)
wick render

# 6. Sync cross-link tables (instant)
wick sync

# 7. Manually create the CurseForge project (CF has no API for project creation)
#    → update cf_project_id in wick.json

# 8. Release (1 min)
wick release WicksAggroMeter 0.1.0

# 9. Manually upload Featured image to CF (no API for gallery images)
```

From ~10 user turns → ~3. Edit flow → 1.

## Sync markers

Add these to any README or doc to enable auto-sync:

```
<!-- wick:suite-table:start -->
<!-- wick:suite-table:end -->
```

`wick sync` replaces everything between them with the current suite table generated from `wick.json`. Safe to run repeatedly — idempotent.

## Not covered (platform limits)

- **In-game screenshots** — manual (you, in WoW)
- **CurseForge Featured / Gallery image upload** — manual (CF web UI only, no public API)
- **CurseForge project *creation*** — manual, one-time per addon (CF API only handles file upload to existing projects)
