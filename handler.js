import './settings.js';
import chalk from 'chalk';
import print from './lib/print.js';
import { smsg } from './lib/simple.js';
import { database } from './lib/database.js';
import { readdirSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';

const toNum = v => (v + '').replace(/[^0-9]/g, '')
const localPart = v => (v + '').split('@')[0].split(':')[0].split('/')[0].split(',')[0]
const normalizeCore = v => toNum(localPart(v))

const normalizeJid = v => {
    if (!v) return ''
    if (typeof v === 'number') v = String(v)
    v = (v + '').trim()
    if (v.startsWith('@')) v = v.slice(1)
    if (v.endsWith('@g.us')) return v
    if (v.includes('@s.whatsapp.net')) {
        const n = toNum(v.split('@')[0])
        return n ? n + '@s.whatsapp.net' : v
    }
    const n = toNum(v)
    return n ? n + '@s.whatsapp.net' : v
}

function pickOwners() {
    const arr = Array.isArray(global.owner) ? global.owner : []
    const flat = []
    for (const v of arr) {
        if (Array.isArray(v)) flat.push({ num: normalizeCore(v[0]), root: !!v[2] })
        else flat.push({ num: normalizeCore(v), root: false })
    }
    return flat
}

function isOwnerJid(jid) {
    const num = normalizeCore(jid)
    return pickOwners().some(o => o.num === num)
}

function isRootOwnerJid(jid) {
    const num = normalizeCore(jid)
    return pickOwners().some(o => o.num === num && o.root)
}

function isPremiumJid(jid) {
    const num = normalizeCore(jid)
    const prems = Array.isArray(global.prems) ? global.prems.map(normalizeCore) : []
    if (prems.includes(num)) return true
    const u = database.data?.users?.[normalizeJid(jid)]
    return !!u?.premium
}

const PREFIXES = ['#', '.', '/', '$']

function getPrefix(body) {
    for (const p of PREFIXES) {
        if (body.startsWith(p)) return p
    }
    return null
}

const similarity = (a, b) => {
    let matches = 0
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
        if (a[i] === b[i]) matches++
    }
    return Math.floor((matches / Math.max(a.length, b.length)) * 100)
}

const eventsLoadedFor = new WeakSet()

export const loadEvents = async (conn) => {
    if (!conn?.ev?.on) return
    if (eventsLoadedFor.has(conn)) return
    eventsLoadedFor.add(conn)

    const eventsPath = resolve('./events')
    let files = []

    try {
        files = readdirSync(eventsPath).filter(f => f.endsWith('.js'))
    } catch {
        console.log(chalk.yellow('[EVENTS] Carpeta ./events no encontrada, omitiendo...'))
        return
    }

    for (const file of files) {
        try {
            const url = pathToFileURL(join(eventsPath, file)).href
            const mod = await import(url)

            if (!mod.event || !mod.run) {
                console.log(chalk.yellow(`[EVENTS] Saltando ${file}, falta event o run`))
                continue
            }

            conn.ev.on(mod.event, (data) => {
                const id = data?.id || data?.key?.remoteJid || null
                if (mod.enabled && id && !mod.enabled(id)) return
                mod.run(conn, data)
            })

            console.log(chalk.green(`[EVENTS] ✦ ${file} → ${mod.event}`))
        } catch (e) {
            console.log(chalk.red(`[EVENTS ERROR] ${file}:`), e.message)
        }
    }
}

export const handler = async (m, conn, plugins) => {
    try {
        if (!m) return;

        await loadEvents(conn)

        m = await smsg(conn, m);

        if (m.isGroup) {
            const muted = database.data?.groups?.[m.chat]?.muted || []
            if (muted.includes(m.sender)) {
                await conn.sendMessage(m.chat, { delete: m.key })
                return
            }
        }

        await print(m, conn);

        if (!m.body) return;

        const prefix = getPrefix(m.body)
        if (!prefix) return;

        const body = m.body.slice(prefix.length).trim()
        const args = body.split(/ +/)
        const commandName = args.shift().toLowerCase()

        if (!commandName) return;

        let cmd = null

        if (prefix === '$') {
            for (const [, plugin] of plugins) {
                if (plugin.customPrefix?.includes('$')) {
                    cmd = plugin
                    args.unshift(commandName)
                    break
                }
            }
        } else {
            for (const [, plugin] of plugins) {
                if (!plugin.command) continue
                const cmds = Array.isArray(plugin.command)
                    ? plugin.command
                    : plugin.command instanceof RegExp
                        ? []
                        : [plugin.command]
                if (cmds.map(c => c.toLowerCase()).includes(commandName)) {
                    cmd = plugin
                    break
                }
            }
        }

        if (!cmd) {
            const allCommands = []
            for (const [, plugin] of plugins) {
                if (!plugin.command) continue
                const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
                for (const c of cmds) {
                    if (typeof c === 'string') allCommands.push(c)
                }
            }

            const similares = allCommands
                .map(c => ({ cmd: c, score: similarity(commandName, c) }))
                .filter(o => o.score >= 40)
                .sort((a, b) => b.score - a.score)
                .slice(0, 3)

            const sugerencias = similares.length
                ? similares.map(s => `*${prefix + s.cmd}* » *${s.score}%*`).join('\n')
                : 'Sin resultados'

            return conn.sendMessage(m.chat, {
                text: `𐄹 ۪ ׁ 🦭ᩚ̼ 𖹭̫ ▎Oh dear… parece que ese comando *(${prefix + commandName})* simplemente no existe
Quizás deberías intentar algo más… funcional.\n-
Te sugiero amablemente usar #menu… a menos que disfrutes equivocarte, claro.

> ◜࣭࣭࣭࣭࣭᷼🪼̸̷ׁᮬᰰᩫ࣭࣭࣭࣭  ¿Similares? Hmm… qué decepción, ni uno solo.\n${sugerencias}`
            }, { quoted: m })
        }

        const senderRawFull = m.sender || ''
        const senderCanonical = senderRawFull.replace(/:[0-9A-Za-z]+(?=@s\.whatsapp\.net)/, '')
        if (senderCanonical !== m.sender) {
            m.realSender = m.sender
            m.sender = senderCanonical
        }

        const isROwner = isRootOwnerJid(m.sender)
        const isOwner = isROwner || isOwnerJid(m.sender)
        const isPremium = isOwner || isPremiumJid(m.sender)
        const isRegistered = isOwner || database.data.users?.[m.sender]?.registered || false

        const isGroup = m.isGroup;
        let isAdmin = false;
        let isBotAdmin = false;

        if (isGroup) {
            try {
                const groupMeta = await conn.groupMetadata(m.chat);
                const participant = groupMeta.participants.find(p =>
                    p.jid === m.sender || p.id === m.sender
                )
                isAdmin = !!participant?.admin || isOwner

                const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net'
                const botParticipant = groupMeta.participants.find(p =>
                    p.jid === botJid || p.id === botJid
                )
                isBotAdmin = !!botParticipant?.admin
            } catch (err) {
                console.log(chalk.red('[ERROR GROUP META]'), err.message);
            }
        }

        // 🟢 INICIALIZACIÓN SEGURA DE BASE DE DATOS 🟢
        if (!database.data.users) database.data.users = {};
        if (!database.data.groups) database.data.groups = {};

        if (!database.data.users[m.sender]) {
            database.data.users[m.sender] = {
                registered: false,
                premium: false,
                banned: false,
                warning: 0,
                exp: 0,
                level: 1,
                limit: 20,
                lastclaim: 0,
                registered_time: 0,
                name: m.pushName || '',
                age: null
            };
            await database.save();
        }

        if (isGroup && !database.data.groups[m.chat]) {
            database.data.groups[m.chat] = {
                modoadmin: false,
                muted: []
            };
            await database.save();
        }

        // Resolución who con soporte LID → JID real
        let who = null;

        if (m.mentionedJid && m.mentionedJid[0]) {
            who = m.mentionedJid[0];
        } else if (m.quoted?.sender) {
            who = m.quoted.sender;
        }

        if (who) {
            const rawNum = who.split('@')[0].split(':')[0]
            const isLid = who.endsWith('@lid') || rawNum.length > 13

            if (isLid && m.isGroup) {
                try {
                    const groupMeta = await conn.groupMetadata(m.chat)
                    // Buscar si algún participante tiene jid @s.whatsapp.net con este lid
                    const found = groupMeta.participants.find(p =>
                        p.id?.split('@')[0] === rawNum
                    )
                    if (found?.jid && found.jid.endsWith('@s.whatsapp.net')) {
                        who = found.jid.includes(':') ? found.jid.split(':')[0] + '@s.whatsapp.net' : found.jid
                    } else if (found?.id && found.id.endsWith('@s.whatsapp.net')) {
                        who = found.id
                    } else {
                        who = rawNum + '@lid'
                    }
                } catch {
                    who = rawNum + '@lid'
                }
            } else {
                who = rawNum + '@s.whatsapp.net'
            }
        }

        // 🛑 INTERCEPTOR DE MODO ADMIN 🛑
        if (isGroup && database.data.groups[m.chat]?.modoadmin && !isAdmin && !isOwner) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ 🦭ᩚ̼ 𖹭̫ ▎ *MODO ADMIN ACTIVADO*\n\n“Oh my… parece que Demi ha decidido cerrar el telón temporalmente”\n“Solo los administradores tienen el privilegio de… participar en este pequeño espectáculo.”\n\n“Te sugiero observar en silencio… o podrías arruinar la función.”');
        }

        if (database.data.users[m.sender]?.banned && !isOwner) {
            return m.reply('*DEMITRA*\n\n◜࣭࣭࣭࣭࣭᷼❌̸̷ׁᮬᰰᩫ࣭࣭࣭࣭  *ACCESO DENEGADO*\n\n“Ah… qué desafortunado.”\n“Has sido… *baneado*.”\n\n“Me temo que los comandos ya no están a tu alcance.”\n“Quizás en otra vida tengas mejor suerte”');
        }

        if (cmd.rowner && !isROwner) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ 👑ᩚ̼ 𖹭̫ ▎ *ACCESO DENEGADO*\n\n“Oh, qué ambición tan… encantadora.”\n\n“Lamentablemente, este privilegio está reservado únicamente para la *creadora principal*.”\n\n“Y tú… bueno, no eres élla”');
        }

        if (cmd.owner && !isOwner) {
             return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ 👑ᩚ̼ 𖹭̫ ▎ *ACCESO RESTRINGIDO*\n\n“Ah… un intento interesante.”\n\n“Pero este comando pertenece exclusivamente a *mi creador*.”\n\n“Y tú, querido… no tienes ese privilegio”');
        }

        if (cmd.premium && !isPremium) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ 💎ᩚ̼ 𖹭̫ ▎*ACCESO PREMIUM*\n\n“Ah… lo siento, pero este pequeño lujo no es para cualquiera”\n\n“Este comando está reservado únicamente para miembros *Premium*.”\n\n“Quizás algún día asciendas… quién sabe.”');
        }

        if (cmd.register && !isRegistered) {
            return m.reply(`*DEMITRA*\n\n𐄹 ۪ ׁ 📝ᩚ̼ 𖹭̫ ▎ *REGISTRO REQUERIDO*\n\n“Oh… parece que aún no existes en mis registros”\n\n“Antes de continuar, tendrás que presentarte como corresponde.”\n\n> Usa: *${prefix}reg nombre.edad*\n> Ejemplo: *${prefix}reg Juan.25*\n\n“No te preocupes… será rápido… si lo haces bien.”`);
        }

        if (cmd.group && !isGroup) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ 🏥ᩚ̼ 𖹭̫ ▎ *SOLO GRUPOS*\n\n“Intentar usar esto aquí… qué fuera de lugar.”\n\n“Este comando pertenece exclusivamente a los grupos.”\n“No desperdicies mi tiempo otra vez.”');
        }

        if (cmd.admin && !isAdmin) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ 🧝🏽‍♀️ᩚ̼ 𖹭̫ ▎ *ACCESO DE ADMINISTRADOR*\n\n“Oh… ¿acaso creíste tener autoridad aquí?”\n“Intentar usar esto sin el rango adecuado…”\n“Qué atrevimiento tan encantador.”\n\n“Este comando está reservado únicamente para los *administradores del grupo*.”\n\n“Y tú… no pareces ser uno de ellos~”\n“No insistas.”');
        }

        if (cmd.botAdmin && !isBotAdmin) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ🤖 ᩚ̼ 𖹭̫ ▎*PERMISOS INSUFICIENTES*\n\n“Intentar esto sin los permisos adecuados…”\n“Qué problemática tan predecible.”\n\n“Concédeme administración en el grupo si deseas que continúe.”');
        }

        if (cmd.private && isGroup) {
            return m.reply('*DEMITRA*\n\n𐄹 ۪ ׁ💬 ᩚ̼ 𖹭̫ ▎ *CHAT PRIVADO*\n\n“Hmm… este no es el lugar adecuado para esto.”\n\n“Si deseas continuar, tendrás que hablar conmigo en *privado*.”\n\n“No todo espectáculo es para el público”');
        }

        if (cmd.limit && !isPremium && !isOwner) {
            const userLimit = database.data.users[m.sender].limit || 0;
            if (userLimit < 1) {
                return m.reply(`𐄹 ۪ ׁ ⚠️ᩚ̼ 𖹭̫ ▎*SIN LÍMITES*\n\n“Has llegado al final de lo que se te permite…”\n\n“No quedan usos disponibles para ti.”\n“Quizás deberías considerar el *Premium*… o aprender a administrarte mejor.”`);
            }
            database.data.users[m.sender].limit -= 1;
            await database.save();
        }

        try {
            await cmd(m, {
                conn,
                args,
                isOwner,
                isROwner,
                isPremium,
                isRegistered,
                isAdmin,
                isBotAdmin,
                isGroup,
                who,
                db: database.data,
                prefix,
                plugins
            })

      } catch (cmdError) {

    console.log(chalk.red('[ERROR COMANDO]'), cmdError)

    const errorMsg = cmdError?.message || String(cmdError)

    let errorType = 'Desconocido'

    if (cmdError?.response) {
        errorType = 'API / HTTP'
    } else if (/html|doctype/i.test(errorMsg)) {
        errorType = 'Respuesta HTML inesperada'
    } else if (/unexpected token|json/i.test(errorMsg)) {
        errorType = 'Error JSON'
    } else if (/cannot find module|err_module_not_found/i.test(errorMsg)) {
        errorType = 'Módulo faltante'
    } else if (/econnrefused|enotfound/i.test(errorMsg)) {
        errorType = 'Conexión fallida'
    } else if (/timeout/i.test(errorMsg)) {
        errorType = 'Timeout'
    }

    const debug = `
❌ *ERROR AL EJECUTAR COMANDO*

📍 Tipo: ${errorType}

🧾 Mensaje:
${errorMsg.slice(0, 500)}

⚙️ Comando:
${m.text || 'desconocido'}
`.trim()

    console.log(chalk.red(debug))

    if (m?.reply) await m.reply(debug)
}