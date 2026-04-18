import chalk from 'chalk'
import moment from 'moment'
import fs from 'fs'
import { load as loadPlugins } from './lib/system/commandLoader.js'
import initDB from './lib/system/initDB.js'
import level from './commands/level.js'
import antilink from './commands/antilink.js'

// Cargar comandos
loadPlugins()

export default async function handler(client, m, plugins = global.plugins) {
    try {
        if (!m || !m.message) return

        const sender = m.sender
        const chat = global.db.data.chats[m.chat] ||= {}
        const user = global.db.data.users[sender] ||= {}

        // =========================
        // 🔹 EXTRAER TEXTO (multi tipo)
        // =========================
        const body =
            m.message.conversation ||
            m.message.extendedTextMessage?.text ||
            m.message.imageMessage?.caption ||
            m.message.videoMessage?.caption ||
            m.message.buttonsResponseMessage?.selectedButtonId ||
            m.message.listResponseMessage?.singleSelectReply?.selectedRowId ||
            m.message.templateButtonReplyMessage?.selectedId ||
            ''

        const text = m.text || body
        if (!text) return

        // =========================
        // 🔹 REACCIONES RANDOM (del primer bot)
        // =========================
        if (!chat.disableReactions) {
            const trigger = /(bot|nanno|ia|robot|:v)/i
            if (trigger.test(body) || Math.random() < 0.01) {
                const emojis = [
                    "😺","😹","😻","😼","🙀","🤖","👑","🐋",
                    "🐢","💗","⚡","🪼","🔥","💘","👀","🫂"
                ]

                const emoji = emojis[Math.floor(Math.random() * emojis.length)]

                await client.sendMessage(m.chat, {
                    react: { text: emoji, key: m.key }
                })
            }
        }

        // =========================
        // 🔹 INIT DB + ANTILINK
        // =========================
        initDB(m, client)
        antilink(client, m)

        // =========================
        // 🔹 PREFIX SYSTEM (mezcla de ambos bots)
        // =========================
        const prefixes = [
            '.', '/', '#', '$',
            global.prefix || '.',
            global.botname?.toLowerCase()?.slice(0, 1)
        ].filter(Boolean)

        const prefix = prefixes.find(p => text.startsWith(p))
        if (!prefix) return

        const args = text.slice(prefix.length).trim().split(/ +/)
        const command = args.shift()?.toLowerCase()
        const input = args.join(' ')

        if (!command) return

        // =========================
        // 🔹 FIND COMMAND
        // =========================
        const cmd = global.comandos?.get(command)
        if (!cmd) return

        // =========================
        // 🔹 LOGS BONITOS
        // =========================
        console.log(
            chalk.blue('╭────────────── NANNO BOT ──────────────'),
            '\n',
            chalk.yellow('Fecha:'), moment().format('DD/MM/YY HH:mm:ss'),
            '\n',
            chalk.cyan('Usuario:'), m.pushName || 'Sin nombre',
            '\n',
            chalk.magenta('Sender:'), sender,
            '\n',
            chalk.green('Command:'), command,
            '\n',
            chalk.blue('╰───────────────────────────────────────')
        )

        // =========================
        // 🔹 EJECUTAR COMANDO
        // =========================
        await cmd.run(client, m, args, prefix, command, input)

        // =========================
        // 🔹 LEVEL SYSTEM
        // =========================
        level(m)

    } catch (err) {
        console.log(chalk.red('[ERROR HANDLER]'), err)

        try {
            await client.sendMessage(m.chat, {
                text: `⚠️ Error en el bot\n\n${err.message || err}`
            }, { quoted: m })
        } catch {}
    }
}