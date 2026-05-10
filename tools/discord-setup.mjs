#!/usr/bin/env node
// discord-setup.mjs — provision the Wick's Mods Discord server in one shot.
//
// Creates: roles (@Wick admin, @Member default), categories, text + voice
// channels, and a forum channel for bug reports with one tag per active addon
// (read from wick.json). All via Discord REST API v10 — no npm deps.
//
// Idempotent: matches existing roles + channels by name and skips them, so the
// script can be re-run safely as the suite grows.
//
// Usage:
//   node WickSuite/tools/discord-setup.mjs --token <BOT_TOKEN> --guild <GUILD_ID> [options]
//
// Env fallbacks: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_OWNER_ID
//
// Options:
//   --owner-id <USER_ID>   assign the @Wick role to this user after creation
//   --dry-run              print the plan without making changes
//   --yes                  skip the confirmation prompt
//
// How to get the prerequisites:
//   1. Create an application at https://discord.com/developers/applications
//   2. Add a Bot, Reset Token, copy it (this is DISCORD_BOT_TOKEN).
//   3. OAuth2 → URL Generator → scopes: bot. Permissions: Administrator.
//      Paste the URL in a browser and invite the bot to your server.
//   4. In Discord, Settings → Advanced → Developer Mode ON.
//      Right-click your server icon → Copy Server ID (this is DISCORD_GUILD_ID).
//   5. (Optional) right-click your own user → Copy User ID for --owner-id.

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

// ── paths ─────────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const TOOLS_DIR  = path.dirname(__filename);
const SUITE_DIR  = path.dirname(TOOLS_DIR);
const CONFIG     = path.join(SUITE_DIR, "wick.json");

// ── CLI args ──────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flagVal = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 && i < argv.length - 1 ? argv[i + 1] : null;
};
const hasFlag = (name) => argv.includes(name);

const TOKEN    = flagVal("--token")    || process.env.DISCORD_BOT_TOKEN || "";
const GUILD    = flagVal("--guild")    || process.env.DISCORD_GUILD_ID || "";
const OWNER_ID = flagVal("--owner-id") || process.env.DISCORD_OWNER_ID || "";
const DRY      = hasFlag("--dry-run");
const YES      = hasFlag("--yes");

function printUsage() {
  console.log(`
Usage:
  node discord-setup.mjs --token <BOT_TOKEN> --guild <GUILD_ID> [options]

Options:
  --owner-id <USER_ID>   assign the @Wick role to this user after creation
  --dry-run              print the plan without making changes (no creds needed)
  --yes                  skip the confirmation prompt

Env fallbacks: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_OWNER_ID
`.trim());
}
if (hasFlag("--help") || hasFlag("-h")) {
  printUsage();
  process.exit(0);
}
if (!DRY && (!TOKEN || !GUILD)) {
  printUsage();
  process.exit(1);
}

// ── Discord REST helpers ──────────────────────────────────────────────────
const API = "https://discord.com/api/v10";

async function discord(method, route, body) {
  const init = {
    method,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "WickSuite-DiscordSetup (https://wicksmods.io, 1.0)",
    },
  };
  if (body !== undefined) init.body = JSON.stringify(body);

  const res = await fetch(API + route, init);

  // Honor rate limit
  if (res.status === 429) {
    const j = await res.json().catch(() => ({}));
    const wait = (j.retry_after ?? 1) * 1000;
    await new Promise(r => setTimeout(r, wait + 250));
    return discord(method, route, body);
  }

  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Discord ${method} ${route} → ${res.status} ${res.statusText}\n${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

// ── Permissions ───────────────────────────────────────────────────────────
const P = {
  VIEW_CHANNEL:             1n << 10n,
  SEND_MESSAGES:            1n << 11n,
  READ_MESSAGE_HISTORY:     1n << 16n,
  ADD_REACTIONS:            1n << 6n,
  ATTACH_FILES:             1n << 15n,
  EMBED_LINKS:              1n << 14n,
  USE_EXTERNAL_EMOJIS:      1n << 18n,
  CONNECT:                  1n << 20n,
  SPEAK:                    1n << 21n,
  USE_VAD:                  1n << 25n,
  CREATE_PUBLIC_THREADS:    1n << 35n,
  SEND_MESSAGES_IN_THREADS: 1n << 38n,
  ADMINISTRATOR:            1n << 3n,
};
const bits = (...keys) => keys.reduce((a, k) => a | P[k], 0n).toString();

// Channel types
const T = { TEXT: 0, VOICE: 2, CATEGORY: 4, FORUM: 15 };

// Brand colors
const COLOR_FEL_GREEN = 0x4FC778;

// ── Read addon roster from wick.json ──────────────────────────────────────
function shortName(addon) {
  return addon.short || addon.title.replace(/^Wick['’]s\s+/i, "");
}
let suiteAddons = [];
try {
  const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  suiteAddons = cfg.addons.filter(a => !a.benched && !a.retired).map(shortName);
} catch (e) {
  console.warn(`! could not read ${CONFIG}: ${e.message}. Forum tags will be empty.`);
}
const FORUM_TAGS = [...suiteAddons.map(name => ({ name })), { name: "Suite (other)" }];

// ── Plan ──────────────────────────────────────────────────────────────────
const PLAN = {
  roles: [
    // Order matters: @Member created first → ends up below @Wick in hierarchy.
    {
      name: "Member",
      color: 0,
      hoist: true,
      mentionable: false,
      permissions: bits(
        "VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY",
        "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS",
        "CONNECT", "SPEAK", "USE_VAD",
        "CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS"
      ),
    },
    {
      name: "Wick",
      color: COLOR_FEL_GREEN,
      hoist: true,
      mentionable: true,
      permissions: bits("ADMINISTRATOR"),
    },
  ],
  categories: [
    {
      name: "Information",
      channels: [
        { name: "welcome",       type: T.TEXT,  readOnly: true,
          topic: "Welcome to Wick's Mods. Pinned: suite roster + landing page (https://wicksmods.io)." },
        { name: "announcements", type: T.TEXT,  readOnly: true,
          topic: "New addon releases, brand updates, suite-wide news. Members read-only." },
      ],
    },
    {
      name: "General",
      channels: [
        { name: "general", type: T.TEXT, topic: "General chat for the Wick's Mods community." },
      ],
    },
    {
      name: "Support",
      channels: [
        { name: "bug-reports", type: T.FORUM, tags: FORUM_TAGS,
          topic: "Report bugs in any Wick addon. Tag your post with the relevant addon. Include WoW build, addon version, and clear repro steps." },
        { name: "community-support", type: T.TEXT,
          topic: "Help each other with addon usage, configuration, and conflicts." },
      ],
    },
    {
      name: "Theorycraft",
      channels: [
        { name: "bis-templates", type: T.FORUM,
          tags: [
            { name: "Druid" },  { name: "Hunter" }, { name: "Mage" },
            { name: "Paladin" }, { name: "Priest" }, { name: "Rogue" },
            { name: "Shaman" }, { name: "Warlock" }, { name: "Warrior" },
          ],
          topic: "Share BIS templates exported from Wick's TBC BIS Tracker. One thread per template. Tag with your class, include phase, spec, and rationale." },
      ],
    },
    {
      name: "LFG",
      channels: [
        { name: "lfg-dungeons", type: T.TEXT, topic: "Looking for group — 5-mans and heroics." },
        { name: "lfg-raids",    type: T.TEXT, topic: "Looking for group — Karazhan, Gruul/Mag, SSC/TK, Hyjal/BT, Sunwell." },
        { name: "lfg-pvp",      type: T.TEXT, topic: "Looking for group — arena teams, BG premades, world PvP." },
      ],
    },
    {
      name: "Voice",
      channels: [
        { name: "General Voice", type: T.VOICE },
        { name: "Dungeon Voice", type: T.VOICE },
        { name: "Raid Voice",    type: T.VOICE },
        { name: "AFK",           type: T.VOICE },
      ],
    },
  ],
};

// ── Print plan ────────────────────────────────────────────────────────────
const TYPE_LABEL = { 0: "text", 2: "voice", 4: "category", 15: "forum" };
console.log("Discord setup plan");
console.log("==================");
console.log(`Guild: ${GUILD}${DRY ? "  (dry run)" : ""}`);
console.log();
console.log("Roles:");
for (const r of PLAN.roles) {
  const flags = [];
  if (r.hoist) flags.push("hoisted");
  if (r.permissions === bits("ADMINISTRATOR")) flags.push("admin");
  console.log(`  @${r.name}${flags.length ? "  (" + flags.join(", ") + ")" : ""}`);
}
console.log();
console.log("Channels:");
for (const cat of PLAN.categories) {
  console.log(`  [${cat.name}]`);
  for (const ch of cat.channels) {
    const tags = ch.tags ? `  tags: ${ch.tags.length}` : "";
    const ro   = ch.readOnly ? "  read-only" : "";
    console.log(`    ${TYPE_LABEL[ch.type].padEnd(8)} ${ch.name}${ro}${tags}`);
  }
}
console.log();

if (DRY) {
  process.exit(0);
}

// ── Confirm ───────────────────────────────────────────────────────────────
async function confirm() {
  if (YES) return true;
  if (!process.stdin.isTTY) return true; // piped input — assume yes
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question("Proceed? [y/N] ", ans => {
      rl.close();
      resolve(ans.trim().toLowerCase() === "y");
    });
  });
}

if (!(await confirm())) {
  console.log("Aborted.");
  process.exit(0);
}

// ── Verify guild access ───────────────────────────────────────────────────
console.log();
let guild;
try {
  guild = await discord("GET", `/guilds/${GUILD}`);
  console.log(`Connected to "${guild.name}".`);
} catch (e) {
  console.error(`! could not access guild ${GUILD}.`);
  console.error("  Check the bot is invited to the server with appropriate permissions.");
  console.error(`  ${e.message.split("\n")[0]}`);
  process.exit(1);
}

// ── Fetch existing state ──────────────────────────────────────────────────
const existingRoles    = await discord("GET", `/guilds/${GUILD}/roles`);
const existingChannels = await discord("GET", `/guilds/${GUILD}/channels`);
const everyoneId = existingRoles.find(r => r.name === "@everyone").id;

const slugify = (s) => s.toLowerCase().replace(/\s+/g, "-");

const findRole = (name) =>
  existingRoles.find(r => r.name.toLowerCase() === name.toLowerCase());
const findCategory = (name) =>
  existingChannels.find(c => c.type === T.CATEGORY && c.name.toLowerCase() === name.toLowerCase());
const findChannel = (name, parentId) => {
  const slug = slugify(name);
  return existingChannels.find(c =>
    c.type !== T.CATEGORY &&
    c.parent_id === parentId &&
    (c.name.toLowerCase() === slug || c.name === name)
  );
};

// ── Create roles ──────────────────────────────────────────────────────────
console.log();
console.log("Roles:");
const roleIds = {};
for (const r of PLAN.roles) {
  const existing = findRole(r.name);
  if (existing) {
    roleIds[r.name] = existing.id;
    console.log(`  · @${r.name} already exists (${existing.id}) — skipping`);
    continue;
  }
  const created = await discord("POST", `/guilds/${GUILD}/roles`, {
    name:        r.name,
    permissions: r.permissions,
    color:       r.color,
    hoist:       r.hoist,
    mentionable: r.mentionable,
  });
  roleIds[r.name] = created.id;
  console.log(`  + @${r.name} created (${created.id})`);
}

// ── Permission overwrite builders ─────────────────────────────────────────
function ovText() {
  // @everyone: deny send. @Member: allow send.
  return [
    {
      id: everyoneId, type: 0, allow: "0",
      deny: bits("SEND_MESSAGES", "ADD_REACTIONS", "CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS"),
    },
    {
      id: roleIds["Member"], type: 0,
      allow: bits("SEND_MESSAGES", "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS",
                  "USE_EXTERNAL_EMOJIS", "CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS"),
      deny: "0",
    },
  ];
}
function ovReadOnly() {
  // Everyone can view + read history; nobody but @Wick (admin) can post.
  return [
    {
      id: everyoneId, type: 0, allow: "0",
      deny: bits("SEND_MESSAGES", "ADD_REACTIONS", "CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS"),
    },
    {
      id: roleIds["Member"], type: 0, allow: "0",
      deny: bits("SEND_MESSAGES", "ADD_REACTIONS", "CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS"),
    },
  ];
}
function ovForum() {
  return [
    {
      id: everyoneId, type: 0, allow: "0",
      deny: bits("CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS", "ADD_REACTIONS"),
    },
    {
      id: roleIds["Member"], type: 0,
      allow: bits("CREATE_PUBLIC_THREADS", "SEND_MESSAGES_IN_THREADS",
                  "ADD_REACTIONS", "ATTACH_FILES", "EMBED_LINKS", "USE_EXTERNAL_EMOJIS"),
      deny: "0",
    },
  ];
}
function ovVoice() {
  return [
    { id: everyoneId,        type: 0, allow: "0", deny: bits("CONNECT") },
    { id: roleIds["Member"], type: 0,
      allow: bits("CONNECT", "SPEAK", "USE_VAD"), deny: "0" },
  ];
}

// ── Create categories + channels ──────────────────────────────────────────
console.log();
console.log("Channels:");
for (const cat of PLAN.categories) {
  let parentId;
  const existingCat = findCategory(cat.name);
  if (existingCat) {
    parentId = existingCat.id;
    console.log(`  · [${cat.name}] already exists — skipping category`);
  } else {
    const created = await discord("POST", `/guilds/${GUILD}/channels`, {
      name: cat.name,
      type: T.CATEGORY,
    });
    parentId = created.id;
    console.log(`  + [${cat.name}] created`);
  }

  for (const ch of cat.channels) {
    const slug = ch.type === T.VOICE ? ch.name : slugify(ch.name);
    const existing = findChannel(slug, parentId);
    if (existing) {
      console.log(`    · ${slug} already exists — skipping`);
      continue;
    }

    const overwrites =
      ch.readOnly        ? ovReadOnly() :
      ch.type === T.VOICE ? ovVoice()    :
      ch.type === T.FORUM ? ovForum()    :
                            ovText();

    const body = {
      name: slug,
      type: ch.type,
      parent_id: parentId,
      permission_overwrites: overwrites,
    };
    if (ch.topic) body.topic = ch.topic;

    if (ch.type === T.FORUM) {
      body.available_tags = ch.tags.map(t => ({ name: t.name, moderated: false }));
      body.default_auto_archive_duration = 10080; // 7 days
      body.default_sort_order = 0;                // latest activity
    }

    try {
      const created = await discord("POST", `/guilds/${GUILD}/channels`, body);
      console.log(`    + ${slug} created (${created.id})`);
    } catch (e) {
      // Forum channels require Community Server. Fall back to a text channel.
      if (ch.type === T.FORUM) {
        console.log(`    ! forum creation failed — falling back to text channel`);
        console.log(`      (enable Community Server in Server Settings to use forum channels)`);
        const fallback = {
          name: slug,
          type: T.TEXT,
          parent_id: parentId,
          permission_overwrites: ovText(),
          topic: ch.topic,
        };
        const created = await discord("POST", `/guilds/${GUILD}/channels`, fallback);
        console.log(`    + ${slug} created as text (${created.id})`);
      } else {
        throw e;
      }
    }
  }
}

// ── Optionally assign @Wick to the owner ──────────────────────────────────
if (OWNER_ID && roleIds["Wick"]) {
  console.log();
  try {
    await discord("PUT", `/guilds/${GUILD}/members/${OWNER_ID}/roles/${roleIds["Wick"]}`);
    console.log(`Assigned @Wick to user ${OWNER_ID}.`);
  } catch (e) {
    console.log(`! could not assign @Wick to user ${OWNER_ID} (${e.status || "?"}). Assign it manually in Discord.`);
  }
}

// ── Done ──────────────────────────────────────────────────────────────────
console.log();
console.log("Done.");
console.log();
console.log("Next steps:");
console.log("  1. Drag the @Wick role above the bot's role in Server Settings → Roles");
console.log("     so the role hierarchy reflects you outranking the bot.");
console.log("  2. Wire up auto-role-on-join via Discord's built-in Onboarding:");
console.log("       Server Settings → Enable Community → walk the wizard.");
console.log("       Then Server Settings → Onboarding → set @Member as the role assigned");
console.log("       on completion. Free, no bot needed at runtime.");
console.log("  3. Pin a welcome message in #welcome with the suite roster + https://wicksmods.io.");
console.log("  4. Create a vanity / non-expiring invite (Server Settings → Invites) and add it");
console.log("     to wick.json under social.discord_invite so wick.mjs can surface it in CF");
console.log("     descriptions, READMEs, and the landing site.");
console.log("  5. (Optional) configure CurseForge release webhook → #announcements so each ship");
console.log("     pings the channel automatically.");
