import {
  proto,
  downloadContentFromMessage,
  getContentType,
  generateWAMessageFromContent,
  generateWAMessage,
  areJidsSameUser
} from '@whiskeysockets/baileys'

import fs from 'fs'
import axios from 'axios'
import moment from 'moment-timezone'
import * as FileType from 'file-type'
import chalk from 'chalk'
import path from 'path'

export const smsg = async (client, m, store) => {
  if (!m) return m

  m.id = m.key?.id
  m.chat = m.key?.remoteJid
  m.fromMe = m.key?.fromMe
  m.isGroup = m.chat?.endsWith('@g.us')

  m.sender = client.decodeJid(
    m.fromMe ? client.user.id : m.key?.participant || m.chat
  )

  m.type = getContentType(m.message)

  m.msg = m.type
    ? m.message[m.type]
    : null

  m.text =
    m.message?.conversation ||
    m.msg?.caption ||
    m.msg?.text ||
    ''

  m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []

  // download media
  m.download = async () => {
    if (!m.msg?.mimetype) return null

    const stream = await downloadContentFromMessage(
      m.msg,
      m.type.replace('Message', '')
    )

    let buffer = Buffer.from([])
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk])
    }
    return buffer
  }

  // reply simple
  m.reply = (text, options = {}) =>
    client.sendMessage(m.chat, { text, ...options }, { quoted: m })

  // react
  m.react = (emoji) =>
    client.sendMessage(m.chat, {
      react: { text: emoji, key: m.key }
    })

  return m
}