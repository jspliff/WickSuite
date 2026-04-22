#!/usr/bin/env node
// Wick — single CLI for the Wick addon suite pipeline.
//
// Subcommands:
//   wick list                      — print the addon roster from wick.json
//   wick scaffold <Display Name>   — create a new addon (folder, files, git, github)
//   wick sync                      — regenerate cross-links in all README.md from wick.json
//   wick render                    — run grab-artboards.mjs (thumbnails + banner)
//   wick release <folder> <ver>    — version bump + CHANGELOG + commit + push + zip + CF upload
//
// Usage (bash / PowerShell):
//   node "C:/Users/jspli/Projects/Wick/WickSuite/tools/wick.mjs" <subcommand> [args]
//
// Requires:
//   - Node 18+
//   - gh CLI authenticated (for scaffold's repo creation)
//   - CURSEFORGE_API_TOKEN env var (for release's CF upload)

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── paths ─────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const TOOLS_DIR  = path.dirname(__filename);
const SUITE_DIR  = path.dirname(TOOLS_DIR);                // .../Projects/Wick/WickSuite
const PROJECT    = path.dirname(SUITE_DIR);                // .../Projects/Wick
const CONFIG     = path.join(SUITE_DIR, "wick.json");
const TEMPLATE   = path.join(SUITE_DIR, "templates/new-addon");
const GRAB_TOOL  = "C:/Users/jspli/.claude/tools/igrab/grab-artboards.mjs";
const GH         = "C:/Program Files/GitHub CLI/gh.exe";

// ── helpers ───────────────────────────────────────────────────────────────
const log  = (...a) => console.log(...a);
const die  = (msg) => { console.error("✗", msg); process.exit(1); };
const ok   = (msg) => console.log("✓", msg);

function readConfig() {
  return JSON.parse(fs.readFileSync(CONFIG, "utf8"));
}
function writeConfig(c) {
  fs.writeFileSync(CONFIG, JSON.stringify(c, null, 2) + "\n");
}
function run(cmd, opts = {}) {
  return execSync(cmd, { stdio: "inherit", shell: true, ...opts });
}
function runCapture(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf8", shell: true, ...opts }).trim();
}
function gitIn(dir, ...args) {
  const r = spawnSync("git", args, { cwd: dir, stdio: "inherit" });
  if (r.status !== 0) {
    die(`git ${args.join(" ")} failed (exit ${r.status}) in ${dir}`);
  }
  return r;
}

// Substitute {{TOKEN}} placeholders in a string.
function tmpl(s, vars) {
  return s.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{{${k}}}`));
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Derive folder from display title: "Wick's Aggro Meter" → "WicksAggroMeter"
function deriveFolder(title) {
  return title.replace(/['']/g, "").replace(/\s+/g, "");
}

// Derive slash: "Wick's Aggro Meter" → "/wam"
function deriveSlash(title) {
  const caps = title.replace(/['']/g, "").split(/\s+/)
    .map(w => w.replace(/^Wick/, "").charAt(0).toLowerCase())
    .filter(Boolean).join("");
  // Prefix with "w" for Wick
  return "/w" + caps;
}

// ═══════════════════════════════════════════════════════════════════════════
// list
// ═══════════════════════════════════════════════════════════════════════════
function cmdList() {
  const c = readConfig();
  log(`Wick suite · ${c.addons.length} active addon${c.addons.length === 1 ? "" : "s"}\n`);
  for (const a of c.addons) {
    log(`  ${a.title}`);
    log(`    folder  : ${a.folder}`);
    log(`    slash   : ${a.slash}`);
    log(`    accent  : ${a.accent} (${a.accent_name})`);
    log(`    cf slug : ${a.cf_slug}  id=${a.cf_project_id ?? "?"}`);
    log(`    repo    : https://github.com/${c.github_user}/${a.repo}`);
    log("");
  }
  if (c.retired?.length) {
    log(`Retired: ${c.retired.map(r => r.folder).join(", ")}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// scaffold <Display Name>
// ═══════════════════════════════════════════════════════════════════════════
function cmdScaffold(rawTitle) {
  if (!rawTitle) die("usage: wick scaffold <Display Name>  (e.g. \"Wick's Aggro Meter\")");
  const config = readConfig();

  // Normalize title to always start with "Wick's "
  let title = rawTitle.trim();
  if (!/^Wick['']s\s/i.test(title)) title = `Wick's ${title}`;
  const folder = deriveFolder(title);
  const short = title.replace(/^Wick['']s\s+/i, "");
  const slug = slugify(short);
  const slash = deriveSlash(title);
  const slashUpper = slash.slice(1).toUpperCase();
  const namespace = folder.toUpperCase(); // e.g. WICKSAGGROMETER, or use derived short
  const savedvars = namespace + "DB";

  const destAddon = path.join(config.addons_root_local, folder);
  const destJunct = path.join(config.project_home, folder);

  if (fs.existsSync(destAddon)) die(`folder already exists: ${destAddon}`);

  log(`\nScaffolding ${title}`);
  log(`  folder    : ${folder}`);
  log(`  slash     : ${slash}`);
  log(`  savedvars : ${savedvars}`);
  log(`  location  : ${destAddon}\n`);

  const vars = {
    TITLE:       title,
    FOLDER:      folder,
    SHORT:       short,
    SHORT_SLUG:  slug,
    SLASH:       slash,
    SLASH_UPPER: slashUpper,
    NAMESPACE:   namespace,
    SAVEDVARS:   savedvars,
    TAGLINE:     `${short} for TBC Classic. Part of the Wick suite.`,
    CF_SLUG:     slug,
    REPO:        folder,
    YEAR:        String(new Date().getFullYear()),
    DATE:        new Date().toISOString().slice(0, 10),
    FEATURE_BULLETS: "- Feature one\n- Feature two\n- Feature three",
  };

  // ── 1. Copy templates with placeholder substitution ────────────────
  fs.mkdirSync(destAddon, { recursive: true });
  for (const entry of fs.readdirSync(TEMPLATE)) {
    const srcPath = path.join(TEMPLATE, entry);
    const dstName = tmpl(entry, vars);
    const dstPath = path.join(destAddon, dstName);
    if (fs.statSync(srcPath).isDirectory()) continue; // flat template
    const body = fs.readFileSync(srcPath, "utf8");
    fs.writeFileSync(dstPath, tmpl(body, vars));
  }
  // Copy logo.svg from suite
  fs.copyFileSync(path.join(SUITE_DIR, "logo.svg"), path.join(destAddon, "logo.svg"));
  ok(`files written to ${destAddon}`);

  // ── 2. Junction into project home so it shows up in Projects\Wick\ ─
  try {
    run(`cmd /c mklink /J "${destJunct}" "${destAddon}"`);
    ok(`junction: ${destJunct} → ${destAddon}`);
  } catch (e) {
    console.warn("! mklink failed (not fatal — you can run it manually later)");
  }

  // ── 3. git init + initial commit ────────────────────────────────────
  gitIn(destAddon, "init", "-b", "main");
  gitIn(destAddon, "add", "-A");
  gitIn(destAddon, "-c", "user.name=Wick", "-c", "user.email=" + config.author_email,
        "commit", "-q", "-m", `Initial commit: ${title} v0.1.0`);
  ok("git: initial commit created");

  // ── 4. Create GitHub repo + push ───────────────────────────────────
  try {
    const ghCmd = `"${GH}" repo create ${config.github_user}/${folder} --public --source=. --remote=origin --push --description="${vars.TAGLINE}"`;
    run(ghCmd, { cwd: destAddon });
    run(`"${GH}" repo edit ${config.github_user}/${folder} --enable-wiki=true --enable-issues=true --enable-discussions=true --add-topic wow --add-topic wow-addon --add-topic tbc-classic --add-topic lua`, { cwd: destAddon });
    ok(`github: https://github.com/${config.github_user}/${folder}`);
  } catch (e) {
    console.warn("! gh repo create failed — run manually:");
    console.warn(`    gh repo create ${config.github_user}/${folder} --public --source=. --remote=origin --push`);
  }

  // ── 5. Register in wick.json ────────────────────────────────────────
  config.addons.push({
    folder,
    title,
    short,
    slash,
    tagline: vars.TAGLINE,
    accent: "#4FC778",
    accent_name: "fel-green",
    cf_slug: slug,
    cf_project_id: null,
    features: ["Feature one", "Feature two", "Feature three"],
    repo: folder,
  });
  writeConfig(config);
  ok(`wick.json: registered ${folder}`);

  log(`\n✓ Done. Next steps:`);
  log(`   1. Edit ${folder}/Core.lua and ${folder}/UI.lua to implement your addon`);
  log(`   2. Take in-game screenshots — save to design-handoff/images/screenshot-${slug}.png`);
  log(`   3. Add a Shot entry to WickSuite/thumbnails.html (component + artboard)`);
  log(`   4. 'wick sync' to regenerate cross-link tables`);
  log(`   5. 'wick render' to generate thumbnails + banner`);
  log(`   6. Create the CurseForge project manually (CF has no API for project creation)`);
  log(`   7. Once CF project ID is known, update cf_project_id in wick.json`);
  log(`   8. 'wick release ${folder} 0.1.0' to publish\n`);
}

// ═══════════════════════════════════════════════════════════════════════════
// sync — regenerate suite cross-link blocks from wick.json
// ═══════════════════════════════════════════════════════════════════════════
function cmdSync() {
  const config = readConfig();
  const marker = {
    start: "<!-- wick:suite-table:start -->",
    end:   "<!-- wick:suite-table:end -->",
  };
  const table = [
    "| Addon | GitHub | CurseForge |",
    "|---|---|---|",
    ...config.addons.map(a =>
      `| **${a.title}** | [repo](https://github.com/${config.github_user}/${a.repo}) | [CurseForge](https://www.curseforge.com/wow/addons/${a.cf_slug}) |`),
  ].join("\n");
  const block = `${marker.start}\n${table}\n${marker.end}`;

  let touched = 0;
  for (const a of config.addons) {
    const readme = path.join(config.addons_root_local, a.folder, "README.md");
    if (!fs.existsSync(readme)) continue;
    let body = fs.readFileSync(readme, "utf8");
    const re = new RegExp(`${marker.start}[\\s\\S]*?${marker.end}`);
    if (re.test(body)) {
      const next = body.replace(re, block);
      if (next !== body) { fs.writeFileSync(readme, next); touched++; ok(`updated ${a.folder}/README.md`); }
    } else {
      log(`  (${a.folder}/README.md has no wick:suite-table marker — add it manually to enable sync)`);
    }
  }
  // Also sync WickSuite/README.md
  const suiteReadme = path.join(SUITE_DIR, "README.md");
  if (fs.existsSync(suiteReadme)) {
    let body = fs.readFileSync(suiteReadme, "utf8");
    const re = new RegExp(`${marker.start}[\\s\\S]*?${marker.end}`);
    if (re.test(body)) {
      const next = body.replace(re, block);
      if (next !== body) { fs.writeFileSync(suiteReadme, next); touched++; ok(`updated WickSuite/README.md`); }
    }
  }
  log(touched ? `\n✓ ${touched} file(s) synced` : `\n(no files had the marker; add <!-- wick:suite-table:start --> … <!-- wick:suite-table:end --> to enable sync)`);
}

// ═══════════════════════════════════════════════════════════════════════════
// render — shortcut to grab-artboards.mjs
// ═══════════════════════════════════════════════════════════════════════════
function cmdRender() {
  run(`node "${GRAB_TOOL}"`);
}

// ═══════════════════════════════════════════════════════════════════════════
// release <folder> <version>
// ═══════════════════════════════════════════════════════════════════════════
async function cmdRelease(folder, newVer) {
  if (!folder || !newVer) die("usage: wick release <folder> <version>");
  const config = readConfig();
  const addon = config.addons.find(a => a.folder === folder);
  if (!addon) die(`addon not found in wick.json: ${folder}`);
  if (!addon.cf_project_id) die(`wick.json missing cf_project_id for ${folder} — set it first`);

  const token = process.env.CURSEFORGE_API_TOKEN;
  if (!token) die("CURSEFORGE_API_TOKEN env var not set");

  const dir = path.join(config.addons_root_local, folder);
  const toc = path.join(dir, `${folder}.toc`);
  if (!fs.existsSync(toc)) die(`.toc not found: ${toc}`);

  // ── Bump version in .toc ──────────────────────────────────────────
  let tocBody = fs.readFileSync(toc, "utf8");
  const oldVer = (tocBody.match(/^## Version:\s*(.+)$/m) || [])[1] || "?";
  tocBody = tocBody.replace(/^## Version:.*$/m, `## Version: ${newVer}`);
  fs.writeFileSync(toc, tocBody);
  ok(`${folder}.toc : ${oldVer} → ${newVer}`);

  // ── Append CHANGELOG entry (stub — user edits after) ───────────────
  // Skip the append if an entry for this version already exists (re-release
  // or the user pre-wrote real notes before running `wick release`).
  const changelog = path.join(dir, "CHANGELOG.md");
  if (fs.existsSync(changelog)) {
    const date = new Date().toISOString().slice(0, 10);
    const existing = fs.readFileSync(changelog, "utf8");
    if (new RegExp(`^##\\s+${newVer.replace(/\./g, "\\.")}\\b`, "m").test(existing)) {
      log(`  CHANGELOG.md already has a ${newVer} entry — leaving it as-is`);
    } else {
      const head = `# ${addon.title} — Changelog\n\n## ${newVer} — ${date}\n\n- (edit this entry with the actual changes)\n\n`;
      const body = existing.startsWith(`# ${addon.title}`)
        ? existing.replace(/^(# [^\n]+\n\n)/, `$1## ${newVer} — ${date}\n\n- (edit this entry with the actual changes)\n\n`)
        : head + existing;
      fs.writeFileSync(changelog, body);
      ok(`CHANGELOG.md: appended ${newVer}`);
    }
  }

  // ── Commit + tag + push ───────────────────────────────────────────
  gitIn(dir, "add", "-A");
  gitIn(dir, "-c", `user.name=${config.author}`, "-c", `user.email=${config.author_email}`,
        "commit", "-q", "-m", `Release ${newVer}`);
  gitIn(dir, "tag", `v${newVer}`);
  gitIn(dir, "push", "origin", "main");
  gitIn(dir, "push", "origin", `v${newVer}`);
  ok(`git: tagged v${newVer} and pushed`);

  // ── Zip the addon folder ─────────────────────────────────────────
  const zipName = `${folder}-v${newVer}.zip`;
  const zipPath = path.join(config.addons_root_local, zipName);
  if (fs.existsSync(zipPath)) fs.rmSync(zipPath);
  // Use PowerShell Compress-Archive (Windows built-in)
  const psCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${dir}' -DestinationPath '${zipPath}' -Force"`;
  run(psCmd);
  ok(`zip: ${zipName}`);

  // ── Upload to CurseForge ─────────────────────────────────────────
  // Write metadata to a temp JSON file and use curl's `-F metadata=<file`
  // reader. Avoids cross-shell single-quote hell (cmd.exe / bash / ps) that
  // would otherwise split the JSON on spaces and lose the metadata field.
  log(`\nUploading to CurseForge project ${addon.cf_project_id} ...`);
  const metadata = JSON.stringify({
    gameVersions: [config.cf_game_version_id],
    releaseType: "release",
    changelog: `Release ${newVer}. See CHANGELOG.md for details.`,
    changelogType: "markdown",
    displayName: `${addon.title} v${newVer}`,
  });
  const metaPath = path.join(config.addons_root_local, `.wick-cf-meta-${folder}.json`);
  fs.writeFileSync(metaPath, metadata);
  const uploadCmd = [
    `curl -s -X POST`,
    `-H "X-Api-Token: ${token}"`,
    `-F "metadata=<${metaPath}"`,
    `-F "file=@${zipPath}"`,
    `"${config.cf_api_base}/api/projects/${addon.cf_project_id}/upload-file"`,
  ].join(" ");
  let resp = runCapture(uploadCmd);
  try { fs.rmSync(metaPath); } catch (_) {}
  log(resp);
  let parsed = null;
  try { parsed = JSON.parse(resp); } catch (_) {}
  if (parsed && parsed.errorCode) {
    die(`CurseForge upload failed (${parsed.errorCode}): ${parsed.errorMessage || "unknown error"}`);
  }
  ok(`CurseForge: uploaded v${newVer}`);

  log(`\n✓ Release complete.`);
  log(`  • Update CHANGELOG.md with real changes (stub inserted)`);
  log(`  • Re-upload Featured image if needed`);
  log(`  • Check https://www.curseforge.com/wow/addons/${addon.cf_slug}`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Dispatch
// ═══════════════════════════════════════════════════════════════════════════
const [,, sub, ...rest] = process.argv;
switch (sub) {
  case "list":     cmdList(); break;
  case "scaffold": cmdScaffold(rest.join(" ")); break;
  case "sync":     cmdSync(); break;
  case "render":   cmdRender(); break;
  case "release":  await cmdRelease(rest[0], rest[1]); break;
  case undefined:
  case "-h":
  case "--help":
    log(`wick — Wick addon suite CLI

usage:
  wick list                       list active addons
  wick scaffold "<Display Name>"  create a new addon (files, git, github, wick.json)
  wick sync                       regenerate suite cross-link tables in every README
  wick render                     run grab-artboards.mjs (thumbnails + banner)
  wick release <folder> <ver>     bump, commit, tag, push, zip, upload to CurseForge

examples:
  node tools/wick.mjs list
  node tools/wick.mjs scaffold "Wick's Aggro Meter"
  node tools/wick.mjs release WicksCDTracker 0.3.0`);
    break;
  default:
    die(`unknown subcommand: ${sub}\n(try: wick --help)`);
}
