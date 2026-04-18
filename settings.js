import fs from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import { watchFile, unwatchFile } from 'fs'

const __filename = fileURLToPath(import.meta.url)

/* ───────── OWNER ───────── */
global.owner = [
  ['5493863447787', 'Dev1', true],
  ['5493863402551', 'Dev2', false]
]

global.mods = []
global.prems = []

/* ───────── BOT INFO ───────── */
global.botNumber = ''

global.namebot = 'Nanno'
global.botname = 'Nanno'
global.wm = 'Nannobot'
global.author = '© Adara'
global.dev = '© Nanno Team'

global.prefix = '.'
global.botVersion = '2.0.0'

global.textbot = 'Donde el silencio responde más que comandos.'
global.emoji = '🦭'

/* ───────── SESSION ───────── */
global.sessions = './Sessions/Owner'
global.subSessions = './Sessions/SubBots'
global.jadi = './Sessions/JadiBots'

/* ───────── LINKS ───────── */
global.groupLink = ''
global.channelLink = ''
global.repo = 'https://github.com/jadeadaralove1/Demitrabot'

/* ───────── DATABASE OPTIONS ───────── */
global.multiplier = 60
global.premiumUsers = []

global.opts = {
  autoread: true,
  queue: false
}

/* ───────── APIs (limpio) ───────── */
global.api = {
  base: 'https://api.stellarwa.xyz',
  key: 'NannoBot'
}

/* ───────── CARPETAS ───────── */
const dirs = [
  './Sessions',
  './Sessions/Owner',
  './Sessions/SubBots',
  global.jadi
]

for (const dir of dirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(chalk.green(`✔ Carpeta creada: ${dir}`))
  }
}

console.log(chalk.green('✔ settings.js cargado'))

/* ───────── AUTO RELOAD ───────── */
watchFile(__filename, () => {
  unwatchFile(__filename)
  console.log(chalk.red('↻ settings.js actualizado, reinicia bot'))
})