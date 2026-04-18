import chalk from 'chalk'

const print = async (m, conn) => {
  if (!m) return

  try {
    const isGroup = m.isGroup || false
    const sender = m.sender || 'unknown@s.whatsapp.net'
    const pushName = m.pushName || 'Sin nombre'
    const chat = m.chat || ''
    const body = m.body || ''
    const type = m.type || 'unknown'

    const time = new Date().toLocaleTimeString('es-AR', { hour12: false })
    const date = new Date().toLocaleDateString('es-AR')

    let header = chalk.gray('╭──────────────────────────────────────')
    let footer = chalk.gray('╰──────────────────────────────────────')

    if (isGroup) {
      let groupName = 'Grupo'

      try {
        const meta = await conn.groupMetadata(chat)
        groupName = meta.subject || 'Grupo'
      } catch {}

      console.log(
        `${header}
${chalk.gray('│')} ${chalk.cyan('🦭')} ${chalk.white(`${date} ${time}`)}
${chalk.gray('│')} ${chalk.green('Grupo :')} ${chalk.yellow(groupName)}
${chalk.gray('│')} ${chalk.magenta('Usuario:')} ${chalk.white(pushName)} ${chalk.gray(`(${sender.split('@')[0]})`)}
${chalk.gray('│')} ${chalk.blue('Tipo   :')} ${chalk.white(type)}
${chalk.gray('│')} ${chalk.yellow('Msg    :')} ${chalk.white((body || '(sin texto)').slice(0, 90))}
${footer}`
      )

    } else {
      console.log(
        `${header}
${chalk.gray('│')} ${chalk.cyan('🦭')} ${chalk.white(`${date} ${time}`)}
${chalk.gray('│')} ${chalk.blue('Privado:')} ${chalk.magenta(pushName)} ${chalk.gray(`(${sender.split('@')[0]})`)}
${chalk.gray('│')} ${chalk.blue('Tipo   :')} ${chalk.white(type)}
${chalk.gray('│')} ${chalk.yellow('Msg    :')} ${chalk.white((body || '(sin texto)').slice(0, 90))}
${footer}`
      )
    }

  } catch (err) {
    console.log(
      chalk.gray('╭──────────────────────────────────────') + '\n' +
      chalk.red('│ ERROR : ') + chalk.white(err.message) + '\n' +
      chalk.gray('╰──────────────────────────────────────')
    )
  }
}

export default print