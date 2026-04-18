import { proto } from '@whiskeysockets/baileys'

export function smsg(conn, m) {
  if (!m) return m

  // ---------------- BASE INFO ----------------
  m.id = m.key?.id
  m.chat = m.key?.remoteJid
  m.fromMe = m.key?.fromMe || false
  m.isGroup = m.chat?.endsWith('@g.us') || false

  m.sender = m.fromMe
    ? conn.user.id
    : m.isGroup
      ? m.key?.participant
      : m.chat

  // limpiar LID / formato raro
  if (typeof m.sender === 'string' && m.sender.includes(':')) {
    m.sender = m.sender.split(':')[0] + '@s.whatsapp.net'
  }

  m.isBaileys = m.id?.startsWith('BAE5') && m.id?.length === 16

  // ---------------- MESSAGE TYPE ----------------
  if (m.message) {
    let type = Object.keys(m.message)[0]
    m.mtype = type

    // ephemeral
    if (type === 'ephemeralMessage') {
      m.message = m.message.ephemeralMessage.message
      m.mtype = Object.keys(m.message)[0]
    }

    // viewOnce
    if (type === 'viewOnceMessage') {
      m.message = m.message.viewOnceMessage.message
      m.mtype = Object.keys(m.message)[0]
    }

    const msg = m.message[m.mtype]
    m.msg = msg

    // ---------------- BODY ----------------
    m.body =
      msg?.conversation ||
      msg?.extendedTextMessage?.text ||
      msg?.imageMessage?.caption ||
      msg?.videoMessage?.caption ||
      msg?.documentMessage?.caption ||
      msg?.buttonsResponseMessage?.selectedButtonId ||
      msg?.templateButtonReplyMessage?.selectedId ||
      msg?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      ''

    m.pushName = m.pushName || 'Sin nombre'

    // ---------------- QUOTED ----------------
    const ctx = msg?.contextInfo

    m.quoted = null

    if (ctx?.quotedMessage) {
      const q = ctx

      m.quoted = {
        message: q.quotedMessage,
        sender: q.participant || q.remoteJid,
        key: {
          remoteJid: m.chat,
          id: q.stanzaId,
          participant: q.participant
        }
      }

      if (typeof m.quoted.sender === 'string' && m.quoted.sender.includes(':')) {
        m.quoted.sender = m.quoted.sender.split(':')[0] + '@s.whatsapp.net'
      }

      const qtype = Object.keys(m.quoted.message)[0]
      m.quoted.mtype = qtype
      const qmsg = m.quoted.message[qtype]

      m.quoted.body =
        qmsg?.conversation ||
        qmsg?.extendedTextMessage?.text ||
        qmsg?.imageMessage?.caption ||
        qmsg?.videoMessage?.caption ||
        ''

      m.quoted.reply = (text) =>
        conn.sendMessage(m.chat, { text }, { quoted: m.quoted })
    }

    // ---------------- MENCIONES ----------------
    m.mentionedJid =
      ctx?.mentionedJid ||
      msg?.extendedTextMessage?.contextInfo?.mentionedJid ||
      []
  }

  // ---------------- HELPERS ----------------
  m.reply = (text) =>
    conn.sendMessage(m.chat, { text: String(text) }, { quoted: m })

  m.react = (emoji) =>
    conn.sendMessage(m.chat, {
      react: { text: emoji, key: m.key }
    })

  m.delete = () =>
    conn.sendMessage(m.chat, { delete: m.key })

  m.download = () => conn.downloadMediaMessage(m)

  return m
}