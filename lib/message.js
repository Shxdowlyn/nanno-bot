import {
  proto,
  downloadContentFromMessage,
  getContentType,
  areJidsSameUser
} from '@whiskeysockets/baileys'

import fs from 'fs'
import axios from 'axios'
import moment from 'moment-timezone'
import chalk from 'chalk'

export const smsg = async (client, m) => {
  if (!m) return m

  m.id = m.key?.id
  m.chat = m.key?.remoteJid
  m.fromMe = m.key?.fromMe || false
  m.isGroup = m.chat?.endsWith('@g.us')

  m.sender = client.decodeJid(
    m.fromMe ? client.user.id : m.key?.participant || m.chat
  )

  m.type = getContentType(m.message)
  m.msg = m.type ? m.message[m.type] : null

  // ---------------- TEXT FIX ----------------
  m.text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.msg?.caption ||
    m.msg?.text ||
    m.msg?.contentText ||
    ''

  m.mentionedJid =
    m.msg?.contextInfo?.mentionedJid ||
    m.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
    []

  // ---------------- DOWNLOAD MEDIA SAFE ----------------
  m.download = async () => {
    try {
      if (!m.msg) return null

      const type = m.type?.replace('Message', '')
      if (!type) return null

      const stream = await downloadContentFromMessage(m.msg, type)

      let buffer = Buffer.from([])
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
      }

      return buffer
    } catch (e) {
      console.log(chalk.red('[DOWNLOAD ERROR]'), e.message)
      return null
    }
  }

  // ---------------- REPLY ----------------
  m.reply = (text, options = {}) =>
    client.sendMessage(
      m.chat,
      { text: String(text), ...options },
      { quoted: m }
    )

  // ---------------- REACT ----------------
  m.react = (emoji) =>
    client.sendMessage(m.chat, {
      react: { text: emoji, key: m.key }
    })

  return m
}