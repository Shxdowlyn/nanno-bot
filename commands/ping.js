export default {
  command: ['ping', 'p'],
  category: 'tools',

  run: async (m, { conn }) => {
    const start = Date.now()

    const msg = await conn.sendMessage(m.chat, {
      text: 'Pinging...'
    }, { quoted: m })

    const end = Date.now()

    await conn.sendMessage(m.chat, {
      text: `🏓 Pong!\n⚡ Speed: ${end - start} ms`
    }, { quoted: msg })
  }
}