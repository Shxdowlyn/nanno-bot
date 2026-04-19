import './settings.js';
import { smsg } from './lib/smsg.js';
import { database } from './lib/system/database.js'
import { readdirSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

// ===================== SAFE IMPORTS =====================
let chalk = {
  green: t => t,
  yellow: t => t,
  red: t => t
};

try {
  chalk = (await import('chalk')).default;
} catch {}

let print = async () => {};
try {
  print = (await import('./lib/print.js')).default;
} catch {}

// ===================== UTIL =====================
const toNum = v => (v + '').replace(/[^0-9]/g, '');

const normalizeJid = v => {
  if (!v) return '';
  v = String(v);
  if (v.includes('@s.whatsapp.net') || v.includes('@g.us')) return v;
  const n = toNum(v);
  return n ? n + '@s.whatsapp.net' : v;
};

// ===================== PREFIX =====================
const PREFIXES = ['#', '.', '/', '$'];
const getPrefix = body => PREFIXES.find(p => body.startsWith(p)) || null;

// ===================== EVENTS =====================
const eventsLoaded = new WeakSet();

export const loadEvents = async (conn) => {
  if (!conn?.ev?.on) return;
  if (eventsLoaded.has(conn)) return;
  eventsLoaded.add(conn);

  const eventsPath = resolve('./events');
  let files = [];

  try {
    files = readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  } catch {
    console.log(chalk.yellow('[EVENTS] No existe carpeta events'));
    return;
  }

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(join(eventsPath, file)).href);

      if (!mod.event || !mod.run) continue;

      conn.ev.on(mod.event, (data) => {
        try {
          mod.run(conn, data);
        } catch (e) {
          console.log(chalk.red('[EVENT ERROR]'), e.message);
        }
      });

      console.log(chalk.green(`[EVENT] ${file} -> ${mod.event}`));
    } catch (e) {
      console.log(chalk.red(`[EVENT LOAD FAIL] ${file}`));
    }
  }
};

// ===================== HANDLER =====================
export const handler = async (m, conn, plugins) => {
  try {
    if (!m) return;

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

    // ===================== FIND COMMAND =====================
    let cmd = null;

    for (const [, plugin] of plugins) {
      if (!plugin.command) continue;

      const cmds = Array.isArray(plugin.command)
        ? plugin.command
        : [plugin.command];

      if (cmds.includes(commandName)) {
        cmd = plugin;
        break;
      }
    }

    if (!cmd) {
      return conn.sendMessage(m.chat, {
        text: `❌ Comando no encontrado: ${prefix + commandName}`
      }, { quoted: m });
    }

    // ===================== DB SAFE =====================
    if (!database.data.users) database.data.users = {};
    if (!database.data.users[m.sender]) {
      database.data.users[m.sender] = {
        exp: 0,
        level: 1,
        premium: false,
        banned: false,
        limit: 20
      };
    }

    const user = database.data.users[m.sender];

    // ===================== BANNED =====================
    if (user.banned) {
      return conn.sendMessage(m.chat, {
        text: '⛔ Usuario baneado'
      }, { quoted: m });
    }

    // ===================== LIMIT =====================
    if (cmd.limit) {
      if (user.limit <= 0) {
        return conn.sendMessage(m.chat, {
          text: '⚠️ Sin límites'
        }, { quoted: m });
      }
      user.limit--;
    }

    // ===================== EXEC =====================
    await cmd(m, {
      conn,
      args,
      db: database.data,
      prefix,
      plugins
    });

  } catch (e) {
    console.log(chalk.red('[HANDLER ERROR]'), e);
  }
};