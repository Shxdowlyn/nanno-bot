import fetch from 'node-fetch';
import { getDevice } from '@whiskeysockets/baileys';
import fs from 'fs';
import axios from 'axios';
import moment from 'moment-timezone';
import { bodyMenu, menuObject } from '../lib/commands.js';

function normalize(text = '') {
  text = text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  return text.endsWith('s') ? text.slice(0, -1) : text;
}

const handler = async (m, { conn, args, usedPrefix }) => {
  try {

    global.db = global.db || { data: { users: {}, groups: {}, settings: {} } };

    const now = new Date();
    const colombianTime = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires ' })
    );

    const tiempo = colombianTime.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/,/g, '');

    const tempo = moment.tz('America/Argentina/Buenos_Aires').format('hh:mm A');

    const botId = conn?.user?.id?.split(':')[0] + '@s.whatsapp.net';

    // 🔥 BANNNER (INITDB + SETTINGS FALLBACK)
    const botSettings = global.db.data.settings?.[botId] || {};

    const banner =
      botSettings.banner ||
      global.db?.data?.settings?.banner ||
      global.banner ||
      '';

    const botname = botSettings.botname || '';
    const namebot = botSettings.namebot || '';
    const owner = botSettings.owner || '';
    const canalId = botSettings.id || '';
    const canalName = botSettings.nameid || '';
    const link = botSettings.link || '';

    const isOficialBot = global.client?.user?.id
      ? botId === global.client.user.id.split(':')[0] + '@s.whatsapp.net'
      : false;

    const botType = isOficialBot ? 'Principal/Owner' : 'Sub Bot';

    const users = Object.keys(global.db.data.users || {}).length;

    const device = getDevice(m.key.id || '');

    const sender = global.db.data.users?.[m.sender]?.name || 'Usuario';

    const time = conn?.uptime
      ? formatearMs(Date.now() - conn.uptime)
      : "Desconocido";

    const alias = {
      anime: ['anime', 'reacciones'],
      downloads: ['downloads', 'descargas'],
      economia: ['economia', 'economy', 'eco'],
      grupo: ['grupo', 'group'],
      profile: ['profile', 'perfil'],
      sockets: ['sockets', 'bots'],
      utils: ['utils', 'utilidades', 'herramientas']
    };

    const input = normalize(args[0] || '');
    const cat = Object.keys(alias).find(k =>
      alias[k].map(normalize).includes(input)
    );

    const category = `${cat ? ` para \`${cat}\`` : '. *(˶ᵔ ᵕ ᵔ˶)*'}`;

    if (args[0] && !cat) {
      return m.reply(
`𐄹 ۪ ׁ 🥀ᩚ̼ 𖹭̫ ▎ La categoria *${args[0]}* no existe, las categorias disponibles son: *${Object.keys(alias).join(', ')}*.`
      );
    }

    const sections = menuObject || {};
    const content = cat
      ? String(sections[cat] || '')
      : Object.values(sections).map(s => String(s || '')).join('\n\n');

    let menu = bodyMenu
      ? String(bodyMenu || '') + '\n\n' + content
      : content;

    const replacements = {
      $owner: owner || 'Oculto por privacidad',
      $botType,
      $device: device,
      $tiempo: tiempo,
      $tempo: tempo,
      $users: users.toLocaleString(),
      $link: link,
      $cat: category,
      $sender: sender,
      $botname: botname,
      $namebot: namebot,
      $prefix: usedPrefix,
      $uptime: time
    };

    for (const [key, value] of Object.entries(replacements)) {
      menu = menu.replace(new RegExp(`\\${key}`, 'g'), value);
    }

    // 🔥 BANNER FIX FINAL (EXACTO COMO QUIERES)
    const isVideo =
      typeof banner === 'string' &&
      /\.(mp4|webm)$/i.test(banner);

    if (isVideo) {
      await conn.sendMessage(m.chat, {
        video: { url: banner },
        gifPlayback: true,
        caption: menu,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });

    } else if (banner) {
      await conn.sendMessage(m.chat, {
        image: { url: banner },
        caption: menu,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });

    } else {
      await conn.sendMessage(m.chat, {
        text: menu,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });
    }

  } catch (e) {
    console.error(e);
    m.reply('Error en el menú: ' + e.message);
  }
};

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'help', 'ayuda'];

export default handler;

function formatearMs(ms) {
  const segundos = Math.floor(ms / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  return [
    dias && `${dias}d`,
    `${horas % 24}h`,
    `${minutos % 60}m`,
    `${segundos % 60}s`
  ].filter(Boolean).join(" ");
}