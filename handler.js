import './settings.js'; import { smsg } from './lib/simple.js'; import { database } from './lib/database.js'; import { readdirSync } from 'fs'; import { join, resolve } from 'path'; import { pathToFileURL } from 'url';

// ========================== // SAFE IMPORTS (no crash if missing) // ========================== let chalk; try { chalk = (await import('chalk')).default; } catch { chalk = { green: (t) => t, yellow: (t) => t, red: (t) => t }; }

let print; try { print = (await import('./lib/print.js')).default; } catch { print = async () => {}; }

// ========================== // UTIL HELPERS // ========================== const toNum = (v) => (v + '').replace(/[^0-9]/g, ''); const localPart = (v) => (v + '').split('@')[0].split(':')[0]; const normalizeCore = (v) => toNum(localPart(v));

const normalizeJid = (v) => { if (!v) return ''; v = String(v).trim(); if (v.startsWith('@')) v = v.slice(1); if (v.endsWith('@g.us')) return v; if (v.includes('@s.whatsapp.net')) return v; const n = toNum(v); return n ? n + '@s.whatsapp.net' : v; };

// ========================== // OWNER SYSTEM // ========================== function pickOwners() { const arr = Array.isArray(global.owner) ? global.owner : []; const flat = []; for (const v of arr) { if (Array.isArray(v)) flat.push({ num: normalizeCore(v[0]), root: !!v[2] }); else flat.push({ num: normalizeCore(v), root: false }); } return flat; }

const isOwnerJid = (jid) => pickOwners().some(o => o.num === normalizeCore(jid)); const isRootOwnerJid = (jid) => pickOwners().some(o => o.num === normalizeCore(jid) && o.root);

const isPremiumJid = (jid) => { const num = normalizeCore(jid); const prems = Array.isArray(global.prems) ? global.prems.map(normalizeCore) : []; if (prems.includes(num)) return true; const u = database.data?.users?.[normalizeJid(jid)]; return !!u?.premium; };

// ========================== // PREFIX // ========================== const PREFIXES = ['#', '.', '/', '$']; const getPrefix = (body) => PREFIXES.find(p => body.startsWith(p)) || null;

// ========================== // EVENTS LOADER (SAFE) // ========================== const eventsLoaded = new WeakSet();

export const loadEvents = async (conn) => { if (!conn?.ev?.on) return; if (eventsLoaded.has(conn)) return; eventsLoaded.add(conn);

const eventsPath = resolve('./events'); let files = [];

try { files = readdirSync(eventsPath).filter(f => f.endsWith('.js')); } catch { console.log(chalk.yellow('[EVENTS] No folder ./events')); return; }

for (const file of files) { try { const url = pathToFileURL(join(eventsPath, file)).href; const mod = await import(url);

if (!mod.event || !mod.run) continue;

  conn.ev.on(mod.event, (data) => {
    try {
      const id = data?.id || data?.key?.remoteJid || null;
      if (mod.enabled && id && !mod.enabled(id)) return;
      mod.run(conn, data);
    } catch (e) {
      console.log(chalk.red('[EVENT ERROR]'), e.message);
    }
  });

  console.log(chalk.green(`[EVENT] ${file} -> ${mod.event}`));
} catch (e) {
  console.log(chalk.red(`[EVENT LOAD FAIL] ${file}: ${e.message}`));
}

} };

// ========================== // MAIN HANDLER // ========================== export const handler = async (m, conn, plugins) => { try { if (!m) return;

await loadEvents(conn);

m = await smsg(conn, m);
if (!m?.body) return;

await print?.(m, conn);

const prefix = getPrefix(m.body);
if (!prefix) return;

const body = m.body.slice(prefix.length).trim();
const args = body.split(/ +/);
const commandName = (args.shift() || '').toLowerCase();

if (!commandName) return;

// ==========================
// FIND COMMAND
// ==========================
let cmd = null;

if (prefix === '$') {
  for (const [, plugin] of plugins) {
    if (plugin.customPrefix?.includes('$')) {
      cmd = plugin;
      args.unshift(commandName);
      break;
    }
  }
} else {
  for (const [, plugin] of plugins) {
    if (!plugin.command) continue;

    const cmds = Array.isArray(plugin.command)
      ? plugin.command
      : [plugin.command];

    if (cmds.map(c => String(c).toLowerCase()).includes(commandName)) {
      cmd = plugin;
      break;
    }
  }
}

// ==========================
// COMMAND NOT FOUND (clean)
// ==========================
if (!cmd) {
  return conn.sendMessage(m.chat, {
    text: `Comando no encontrado: ${prefix + commandName}\nUsa ${prefix}menu para ver comandos.`
  }, { quoted: m });
}

// ==========================
// CONTEXT
// ==========================
const isROwner = isRootOwnerJid(m.sender);
const isOwner = isROwner || isOwnerJid(m.sender);
const isPremium = isOwner || isPremiumJid(m.sender);
const isGroup = m.isGroup;

let isAdmin = false;
let isBotAdmin = false;

if (isGroup) {
  try {
    const meta = await conn.groupMetadata(m.chat);
    const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';

    isAdmin = meta.participants.some(p =>
      (p.id || p.jid) === m.sender && p.admin
    ) || isOwner;

    isBotAdmin = meta.participants.some(p =>
      (p.id || p.jid) === botJid && p.admin
    );
  } catch {}
}

// ==========================
// DB INIT SAFE
// ==========================
if (!database.data.users) database.data.users = {};
if (!database.data.groups) database.data.groups = {};

if (!database.data.users[m.sender]) {
  database.data.users[m.sender] = {
    exp: 0,
    level: 1,
    premium: false,
    banned: false,
    limit: 20
  };
}

if (isGroup && !database.data.groups[m.chat]) {
  database.data.groups[m.chat] = {
    muted: []
  };
}

// ==========================
// BANNED CHECK
// ==========================
if (database.data.users[m.sender]?.banned && !isOwner) {
  return conn.sendMessage(m.chat, { text: 'Acceso denegado (banned user).' }, { quoted: m });
}

// ==========================
// LIMIT SYSTEM
// ==========================
if (cmd.limit && !isPremium && !isOwner) {
  const u = database.data.users[m.sender];
  if ((u.limit || 0) <= 0) {
    return conn.sendMessage(m.chat, { text: 'Sin límites disponibles.' }, { quoted: m });
  }
  u.limit -= 1;
}

// ==========================
// EXEC COMMAND
// ==========================
try {
  await cmd(m, {
    conn,
    args,
    isOwner,
    isPremium,
    isAdmin,
    isBotAdmin,
    isGroup,
    db: database.data,
    prefix,
    plugins
  });
} catch (e) {
  console.log(chalk.red('[COMMAND ERROR]'), e);
  return conn.sendMessage(m.chat, {
    text: 'Error ejecutando comando.'
  }, { quoted: m });
}

} catch (e) { console.log(chalk.red('[HANDLER ERROR]'), e); } };