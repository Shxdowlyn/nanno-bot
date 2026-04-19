import chalk from 'chalk';

const print = async (m, conn) => {
    if (!m) return;

    try {
        const isGroup = m.isGroup;
        const sender = m.sender || 'unknown';
        const pushName = m.pushName || 'Sin nombre';
        const chat = m.chat || '';
        const body = m.body || '';
        const type = m.type || 'unknown';

        const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
        const date = new Date().toLocaleDateString('es-ES');

        if (isGroup) {
            let groupName = 'Grupo';
            try {
                const meta = await conn.groupMetadata(chat);
                groupName = meta.subject || 'Grupo';
            } catch {}

            console.log(
                chalk.gray('╭──────────────────────────────────────') + '\n' +
                chalk.gray('│ ') + chalk.cyanBright('♡ ') + chalk.whiteBright(`${date} ${time}`) + '\n' +
                chalk.gray('│ ') + chalk.greenBright('♡ GRUPO  : ') + chalk.yellowBright(groupName) + '\n' +
                chalk.gray('│ ') + chalk.magentaBright('♡ SENDER : ') + chalk.whiteBright(pushName) + chalk.gray(` (${sender.split('@')[0]})`) + '\n' +
                chalk.gray('│ ') + chalk.blueBright('♡ TIPO   : ') + chalk.whiteBright(type) + '\n' +
                chalk.gray('│ ') + chalk.yellowBright('♡ MSG    : ') + chalk.whiteBright(body.slice(0, 80) || '(sin texto)') + '\n' +
                chalk.gray('╰──────────────────────────────────────')
            );
        } else {
            console.log(
                chalk.gray('╭──────────────────────────────────────') + '\n' +
                chalk.gray('│ ') + chalk.cyanBright('♡ ') + chalk.whiteBright(`${date} ${time}`) + '\n' +
                chalk.gray('│ ') + chalk.blueBright('♡ PRIVADO: ') + chalk.magentaBright(pushName) + chalk.gray(` (${sender.split('@')[0]})`) + '\n' +
                chalk.gray('│ ') + chalk.blueBright('♡ TIPO   : ') + chalk.whiteBright(type) + '\n' +
                chalk.gray('│ ') + chalk.yellowBright('♡ MSG    : ') + chalk.whiteBright(body.slice(0, 80) || '(sin texto)') + '\n' +
                chalk.gray('╰──────────────────────────────────────')
            );
        }

    } catch (e) {
        console.log(
            chalk.gray('╭──────────────────────────────────────') + '\n' +
            chalk.gray('│ ') + chalk.redBright('ꗃ ERROR : ') + chalk.white(e.message) + '\n' +
            chalk.gray('╰──────────────────────────────────────')
        );
    }
};

export default print;