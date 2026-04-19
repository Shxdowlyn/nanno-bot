import fs from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'


// CONFIGURACIÓN DE IDENTIDAD


global.botName    = 'Nanno bot'
global.ownerName  = 'Adara owner'
global.botVersion = '1.0.5'

global.owner = [
    ['543863402551',    'Adara',     true],
    ['543863447787',    'Jade',     true],
]

global.owners = global.owner.map(v => v[0])
global.mods   = []
global.prems  = []

global.prefix = '#'


// ENLACES Y BANNERS


global.rcanal         = 'https://whatsapp.com/channel/0029VbBvrmwC1Fu5SYpbBE2A'
global.newsletterJid  = '120363406529946290@newsletter'
global.newsletterName = 'Nanno bot'
global.banner         = 'https://causas-files.vercel.app/fl/k7uk.jpg'

// ————————————————————————————————————————————————————————————————————


global.apis = {
    alya: {
        base: 'https://rest.alyabotpe.xyz',
        key:  'Duarte-zz12'
    },
    gifted: {
        base: 'https://api.giftedtech.co.ke/api',
        key:  'Fedex'
    },
    causas: {
        base: 'https://api-causas.duckdns.org/api/v1',
        key:  'causa-adc2c572476abdd8'
    }
}



/**
 * Retorna la URL del banner según el contexto actual.
 * Si hay un sub-bot activo con su propio banner → lo usa.
 * Si no → banner global del bot principal.
 * @param {object|null} db
 * @returns {string}
 */
global.getActiveBanner = (db = null) => {
    const subbotId = global._currentSubbotId
    if (subbotId && db?.subbots?.[subbotId]?.banner) {
        return db.subbots[subbotId].banner
    }
    return global.banner
}

/**
 * Descarga el banner activo y lo retorna como Buffer.
 * @param {object|null} db
 * @returns {Buffer|null}
 */
global.getBannerThumb = async (db = null) => {
    try {
        const url = global.getActiveBanner(db)
        const res = await fetch(url)
        return Buffer.from(await res.arrayBuffer())
    } catch {
        return null
    }
}

// ————————————————————————————————————————————————————————————————————
// NEWSLETTER CONTEXT 🦋
// Uso en plugins: global.getNewsletterCtx(thumbnail, title, body)
// ————————————————————————————————————————————————————————————————————

global.getNewsletterCtx = (thumbnail = null, title = null, body = null) => {
    return {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid:  global.newsletterJid,
            serverMessageId: '',
            newsletterName: global.newsletterName
        },
        externalAdReply: {
            title:               title || `🌸 ${global.botName}`,
            body:                body  || 'Nino Nakano Bot 🦋',
            mediaType:           1,
            mediaUrl:            global.rcanal,
            sourceUrl:           global.rcanal,
            thumbnail,
            showAdAttribution:   false,
            containsAutoReply:   true,
            renderLargerThumbnail: false
        }
    }
}

// ————————————————————————————————————————————————————————————————————
// MENSAJES DE SISTEMA (Estilo Tsundere 🦋)
// ————————————————————————————————————————————————————————————————————

global.mess = {
    wait:     'Un momento, no me apresures... ¿No ves que estoy ocupada? 🦋',
    success:  '¡Listo! Qué fácil fue. Ni me des las gracias. ✨',
    error:    'Ugh, algo salió mal en el código. Arréglalo tú, tonto. 💢',
    owner:    '¿Y tú quién eres? Este comando es exclusivo para Aarom. 😤',
    group:    '¡Oye! Esto solo funciona en grupos. No seas raro. 🙄',
    admin:    '¿Quién te crees? Solo los administradores tienen permiso para esto. 💅',
    botAdmin: 'Primero hazme administradora si quieres que haga el trabajo por ti. 😒',
    restrict: 'Esta función está bloqueada por ahora. No insistas. 🔒',
    notReg:   'No hablo con extraños. Regístrate con #reg si quieres mi atención. 📝'
}

// ————————————————————————————————————————————————————————————————————
// AUTO-RELOAD
// ————————————————————————————————————————————————————————————————————

const file = fileURLToPath(import.meta.url)

fs.watchFile(file, async () => {
    try {
        fs.unwatchFile(file)
        console.log(chalk.magentaBright('\n🦋 [SETTINGS]: Cambios guardados. Solo Aarom y Félix tienen el control ahora.'))
        await import(`${file}?update=${Date.now()}`)
    } catch (e) {
        console.error(chalk.red('[!] Error en auto-reload:'), e)
    }
})

export default global