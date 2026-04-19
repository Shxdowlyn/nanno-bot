import { getDevice } from '@whiskeysockets/baileys'
import moment from 'moment-timezone'
import { bodyMenu, menuObject } from '../lib/commands.js'

function normalize(text = '') {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

const handler = async (m, { conn, args, usedPrefix }) => {
  try {

    // 🔥 DB COMPLETAMENTE INDEPENDIENTE (NO initDB)
    global.db ||= {}
    global.db.data ||= {}
    global.db.data.users ||= {}
    global.db.data.groups ||= {}
    global.db.data.settings ||= {}

    const botId = conn?.user?.id
      ? conn.user.id.split(':')[0] + '@s.whatsapp.net'
      : 'default@bot'

    const settings = global.db.data.settings

    // 🔥 settings del bot seguro
    settings[botId] ||= {}

    const botSettings = settings[botId]

    // 📡 canal obligatorio fallback
    botSettings.id ??= '120363406529946290@newsletter'

    // 🎯 banner SOLO desde settings (como pediste)
    const banner = botSettings.banner || ''

    const botname = botSettings.botname || 'Bot'
    const owner = botSettings.owner || 'Desconocido'
    const link = botSettings.link || ''

    const users = Object.keys(global.db.data.users).length
    const device = getDevice(m.key?.id || '')

    const time = conn?.uptime
      ? formatTime(Date.now() - conn.uptime)
      : 'Desconocido'

    // 🌎 hora fija sin crash timezone
    const hour = parseInt(
      new Date().toLocaleTimeString('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        hour: '2-digit',
        hour12: false
      })
    )

    const saludo =
      hour < 12 ? 'buenos días ☀️' :
      hour < 18 ? 'buenas tardes 🌸' :
      'buenas noches 🌙'

    // 📦 categorías seguras
    const sections = menuObject && Object.keys(menuObject).length
      ? menuObject
      : { misc: ['menu vacío'] }

    const content = args[0]
      ? sections[normalize(args[0])] || ''
      : Object.values(sections).map(s => s.join?.('\n') || s).join('\n\n')

    let menu = (bodyMenu || '') + '\n\n' + content

    menu = menu
      .replace(/\$botname/g, botname)
      .replace(/\$owner/g, owner)
      .replace(/\$users/g, users)
      .replace(/\$device/g, device)
      .replace(/\$uptime/g, time)
      .replace(/\$saludo/g, saludo)
      .replace(/\$link/g, link)

    // 📱 banner tipo WhatsApp web (externalAdReply)
    const contextInfo = {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: botname,
        body: 'WhatsApp',
        mediaType: 1,
        renderLargerThumbnail: true,
        thumbnailUrl: banner || null,
        sourceUrl: 'https://www.whatsapp.com'
      }
    }

    await conn.sendMessage(m.chat, {
      text: menu,
      contextInfo
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    m.reply('❌ Error en el menú: ' + e.message)
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'ayuda']

export default handler

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)

  return [
    d && `${d}d`,
    `${h % 24}h`,
    `${m % 60}m`,
    `${s % 60}s`
  ].filter(Boolean).join(' ')
}