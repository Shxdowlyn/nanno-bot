export default {
  command: ['ping'],

  run: async (m, { conn }) => {
    await conn.sendMessage(m.chat, { text: '🏓 Pong!' }, { quoted: m })
  }
}