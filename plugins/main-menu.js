import fs from 'fs'
import fetch from 'node-fetch'
import { database } from '../lib/database.js'

const handler = async (m, { conn }) => {
    try {

        const botname = global.botname || global.botName || 'Zero Two'

        // 🔥 SETTINGS SAFE + CANAL ID (NO SE USA EN MENSAJE)
        global.db = global.db || { data: { settings: {}, users: {} } }
        global.db.data.settings = global.db.data.settings || {}

        const botId = conn?.user?.id?.split(':')[0] + '@s.whatsapp.net'

        global.db.data.settings[botId] ??= {}
        global.db.data.settings[botId].id ??= '120363406529946290@newsletter'

        const pluginFiles = fs.readdirSync('./plugins').filter(file => file.endsWith('.js'))

        const grouped = {}

        for (const file of pluginFiles) {
            try {
                const plugin = (await import(`../plugins/${file}`)).default
                const tags = plugin?.tags || ['misc']
                const cmd = plugin?.command?.[0] || file.replace('.js', '')

                for (const tag of tags) {
                    if (!grouped[tag]) grouped[tag] = []
                    grouped[tag].push(cmd)
                }
            } catch {
                const cmd = file.replace('.js', '')
                if (!grouped['misc']) grouped['misc'] = []
                grouped['misc'].push(cmd)
            }
        }

        const totalCmds = Object.values(grouped).flat().length
        const totalUsers = Object.keys(database.data.users || {}).length
        const registeredUsers = Object.values(database.data.users || {}).filter(u => u.registered).length

        const zonaHoraria = 'America/Bogota'
        const ahora = new Date()
        const hora = parseInt(
            ahora.toLocaleTimeString('es-CO', {
                timeZone: zonaHoraria,
                hour: '2-digit',
                hour12: false
            })
        )

        let saludo, carita

        if (hora >= 5 && hora < 12) {
            saludo = 'buenos días'
            carita = '(＊^▽^＊) ☀️'
        } else if (hora >= 12 && hora < 18) {
            saludo = 'buenas tardes'
            carita = '(｡•̀ᴗ-)✧ 🌸'
        } else {
            saludo = 'buenas noches'
            carita = '(◕‿◕✿) 🌙'
        }

        const seccionesTexto = Object.entries(grouped)
            .map(([tag, cmds]) =>
`𖤐 *${tag.toUpperCase()}*
${cmds.map(c => `  ꕦ ${c}`).join('\n')}`
            ).join('\n\n')

        // 🌐 ESTILO “WHATSAPP WEB LOADING”
        let menuTexto = `
📡 *Conectando a WhatsApp Web...*
────────────────────
❖ *${botname} MENU*
❝ Hola *${m.pushName}*, ${saludo} ${carita}
Sistema cargado correctamente 💗 ❞

ꙮ *Comandos:* ${totalCmds}
ꙮ *Usuarios:* ${totalUsers}
ꙮ *Registrados:* ${registeredUsers}

────────────────────

${seccionesTexto}

────────────────────
🌐 whatsapp.com
`.trim()

        const response = await fetch('https://causas-files.vercel.app/fl/9vs2.jpg')
        const buffer = await response.buffer()

        await conn.sendMessage(m.chat, {
            image: buffer,
            caption: menuTexto,
            contextInfo: {
                externalAdReply: {
                    title: botname,
                    body: 'whatsapp web • loading menu',
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    thumbnail: buffer,
                    sourceUrl: 'https://web.whatsapp.com'
                }
            }
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('💔 Error al cargar el menú...')
    }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'ayuda']

export default handler