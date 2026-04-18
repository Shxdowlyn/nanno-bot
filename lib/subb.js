import {
  makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  jidDecode,
  Browsers
} from '@whiskeysockets/baileys'

import qrcode from 'qrcode'
import NodeCache from 'node-cache'
import pino from 'pino'
import fs from 'fs'
import chalk from 'chalk'
import { smsg } from './simple.js'
import main from '../index.js'

const retryMap = {}
const sessions = global.conns ||= []

const msgCache = new NodeCache({ stdTTL: 0 })
const groupCache = new NodeCache({ stdTTL: 3600 })

const cleanJid = (jid = '') => jid.replace(/:\d+/, '').split('@')[0]

export async function startSubBot(
  m,
  client,
  caption = '',
  usePairing = false,
  phone = '',
  chatId = '',
  flags = {},
  isCommand = false
) {

  const id = phone || (m?.sender || '').split('@')[0]
  const sessionPath = `./Sessions/SubBots/${id}`

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: false,
    browser: Browsers.macOS('Chrome'),
    logger: pino({ level: 'silent' }),

    markOnlineOnConnect: true,
    syncFullHistory: false,

    msgRetryCounterCache: msgCache,
    cachedGroupMetadata: jid => groupCache.get(jid),

    getMessage: async () => ({}),
    keepAliveIntervalMs: 60000
  })

  sock.decodeJid = (jid) => {
    if (!jid) return jid
    if (jid.includes(':')) {
      const decoded = jidDecode(jid) || {}
      return decoded.user && decoded.server
        ? `${decoded.user}@${decoded.server}`
        : jid
    }
    return jid
  }

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update

    if (isNewLogin) sock.isInit = false

    if (connection === 'open') {
      sock.isInit = true
      sock.userId = cleanJid(sock.user?.id)

      global.db.data.settings[sock.userId + '@s.whatsapp.net'] ||= {
        type: 'Sub',
        bot: true
      }

      if (!sessions.find(c => c.userId === sock.userId)) {
        sessions.push(sock)
      }

      delete retryMap[sock.userId]

      console.log(
        chalk.green(`[SUBBOT] Conectado: ${sock.userId}`)
      )
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      const idBot = sock.userId || id

      retryMap[idBot] = (retryMap[idBot] || 0) + 1

      const retries = retryMap[idBot]

      const restart = () => {
        setTimeout(() => {
          startSubBot(m, client, caption, usePairing, phone, chatId, {}, isCommand)
        }, 3000)
      }

      if ([401, 403].includes(reason)) {
        if (retries < 5) {
          console.log(`[SUBBOT] Reintentando (${retries}/5)`)
          restart()
        } else {
          console.log(`[SUBBOT] Eliminando sesión ${idBot}`)
          fs.rmSync(sessionPath, { recursive: true, force: true })
          delete retryMap[idBot]
        }
        return
      }

      if (
        [
          DisconnectReason.connectionClosed,
          DisconnectReason.connectionLost,
          DisconnectReason.timedOut
        ].includes(reason)
      ) {
        restart()
        return
      }

      restart()
    }

    // QR normal
    if (qr && !usePairing && client && chatId && flags[m.sender]) {
      try {
        const qrBuffer = await qrcode.toBuffer(qr)

        const sent = await client.sendMessage(chatId, {
          image: qrBuffer,
          caption
        }, { quoted: m })

        delete flags[m.sender]

        setTimeout(() => {
          client.sendMessage(chatId, { delete: sent.key }).catch(() => {})
        }, 60000)

      } catch (e) {
        console.log('[QR ERROR]', e)
      }
    }

    // Pairing code
    if (qr && usePairing && phone && client && chatId && flags[m.sender]) {
      try {
        let code = await sock.requestPairingCode(phone)
        code = code?.match(/.{1,4}/g)?.join('-') || code

        const msg = await m.reply(caption)
        const msg2 = await m.reply(code)

        delete flags[m.sender]

        setTimeout(() => {
          client.sendMessage(chatId, { delete: msg.key }).catch(() => {})
          client.sendMessage(chatId, { delete: msg2.key }).catch(() => {})
        }, 60000)

      } catch (e) {
        console.log('[PAIRING ERROR]', e)
      }
    }
  })

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return

    for (const msgRaw of messages) {
      if (!msgRaw.message) continue

      const msg = await smsg(sock, msgRaw)

      try {
        await main(sock, msg, messages)
      } catch (e) {
        console.log('[SUBBOT MSG ERROR]', e)
      }
    }
  })

  return sock
}