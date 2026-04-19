import './settings.js'
import chalk from 'chalk'
import pino from 'pino'
import qrcode from 'qrcode-terminal'
import fs from 'fs'
import readlineSync from 'readline-sync'
import { exec } from 'child_process'

import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  Browsers,
  makeCacheableSignalKeyStore,
  jidDecode
} from '@whiskeysockets/baileys'

import { smsg } from './lib/message.js'
import './handler.js'

/* ───────────── LOG ───────────── */
const log = {
  info: (m) => console.log(chalk.blue('[INFO]'), m),
  warn: (m) => console.log(chalk.yellow('[WARN]'), m),
  error: (m) => console.log(chalk.red('[ERROR]'), m),
  success: (m) => console.log(chalk.green('[OK]'), m)
}

/* ───────────── PHONE NORMALIZER ───────────── */
const DIGITS = (s = '') => String(s).replace(/\D/g, '')

function normalizePhone(input) {
  let s = DIGITS(input)
  if (!s) return ''

  if (s.startsWith('0')) s = s.replace(/^0+/, '')
  if (s.length === 10 && s.startsWith('3')) s = '57' + s
  if (s.startsWith('52') && !s.startsWith('521')) s = '521' + s.slice(2)
  if (s.startsWith('54') && !s.startsWith('549')) s = '549' + s.slice(2)

  return s
}

/* ───────────── OPCIÓN DE INICIO ───────────── */
let opcion = ''
let phoneNumber = ''

if (process.argv.includes('--qr')) opcion = '1'
else if (process.argv.includes('--code')) opcion = '2'
else if (!fs.existsSync('./Sessions/Owner/creds.json')) {
  opcion = readlineSync.question(
    '\n1. QR\n2. Código (8 dígitos)\n--> '
  )

  while (!['1', '2'].includes(opcion)) {
    opcion = readlineSync.question('--> ')
  }

  if (opcion === '2') {
    const input = readlineSync.question('Número WhatsApp: ')
    phoneNumber = normalizePhone(input)
  }
}

/* ───────────── BOT PRINCIPAL ───────────── */
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./Sessions/Owner')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    markOnlineOnConnect: true
  })

  sock.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:/.test(jid)) {
      const d = jidDecode(jid) || {}
      return d.user && d.server ? `${d.user}@${d.server}` : jid
    }
    return jid
  }

  sock.ev.on('creds.update', saveCreds)

  /* ───────── QR ───────── */
  if (opcion === '1') {
    sock.ev.on('connection.update', ({ qr }) => {
      if (qr) {
        console.log(chalk.magenta('\nEscanea el QR:\n'))
        qrcode.generate(qr, { small: true })
      }
    })
  }

  /* ───────── PAIRING CODE ───────── */
  if (opcion === '2') {
    setTimeout(async () => {
      try {
        if (!state.creds.registered) {
          const code = await sock.requestPairingCode(phoneNumber)
          console.log(chalk.green('\nCódigo de emparejamiento:'), code)
        }
      } catch (e) {
        log.error(e.message)
      }
    }, 3000)
  }

  /* ───────── CONEXIÓN ───────── */
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'open') {
      log.success('Bot conectado correctamente')
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason === DisconnectReason.loggedOut) {
        log.warn('Sesión cerrada')
        exec('rm -rf ./Sessions/Owner/*')
        process.exit(1)
      } else {
        log.warn('Reconectando...')
        startBot()
      }
    }
  })

  /* ───────── MENSAJES ───────── */
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0]
      if (!m.message) return

      const msg = await smsg(sock, m)
      await main(sock, msg)
    } catch (e) {
      console.log(e)
    }
  })
}

/* ───────── START ───────── */
console.log(chalk.magenta('\nIniciando bot...\n'))
startBot()