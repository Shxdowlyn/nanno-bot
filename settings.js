import { watchFile, unwatchFile } from 'fs';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import fs from 'fs';

const scriptPath = fileURLToPath(import.meta.url);

global.owner = [
['5493863447787', 'Dev1','true'],
['5493863402551', 'dev2'],
];
global.mods = [];
global.suittag = [];
global.prems = [];

global.botNumber = '';

global.libreria = 'Baileys';
global.baileys = 'V 6.7.17';
global.vs = '1.0.0';
global.nameqr = 'DEMITRA BOT 🦭';
global.namebot = 'DE MI TRA';
global.sessions = './Sessions/Owner';
global.jadi = 'JadiBots';

global.packname = 'Demitra';
global.botname = 'Demitra';
global.botName = 'Demitra';
global.wm = 'Demitrabot';
global.author = '© DemiDevTeam';
global.dev = '© DemitraTeam';
global.textbot = 'ִㅤ୨ 🪼 ୧ㅤ Donde el silencio responde más que mil comandos.  ૮₍´｡･⩊･ ｡₎ა';
global.etiqueta = 'Demitra';

global.moneda = 'Stamps';
global.currencySymbol = 'Stamps';

global.welcom1 = 'Oh, qué maravilla… un nuevo invitado ha llegado.\nBienvenido al espectáculo, querido~\nCompórtate… o podría volver esto mucho más interesante.\nPuedes ajustar este mensaje con setwelcome, si te atreves.';

global.welcom2 = 'Y así, sin más, uno abandona el escenario.\nQué fugaz resulta la presencia humana, ¿no crees?\n🖤 Esperemos que hayas aprendido algo antes de desaparecer.\nEdita este mensaje con setbye… si aún queda alguien escuchando.';
global.banner = 'https://files.catbox.moe/66gvcy.jpg';
global.bannerUrl = 'https://files.catbox.moe/4jr8f5.jpg';
global.avatar = 'https://files.catbox.moe/imfx2l.jpg';
global.iconUrl = 'https://files.catbox.moe/glvart.jpg';
global.catalogo = null;
global.catalogImage = null;

global.botVersion = '1.0.0';
global.botEmoji = '🦭';
global.emoji = '🐢';
global.emoji2 = '🪼';
global.emoji3 = '🐋';
global.prefix = '.';

global.botText = 'love by Adara';
global.botTag = 'DEMITRA';
global.devCredit = '© DemitraTeam';
global.authorCredit = '© DemiTeam';

global.groupLink = 'https://chat.whatsapp.com/tu-link-grupo';
global.communityLink = 'https://whatsapp.com/channel/0029VbBvrmwC1Fu5SYpbBE2A';
global.channelLink = 'https://whatsapp.com/channel/0029VbBvrmwC1Fu5SYpbBE2A';
global.gitHubRepo = 'https://github.com/jadeadaralove1/Demitrabot';
global.emailContact = 'tvxuperlove@gmail.com';
global.correo = 'tvxuperlove@gmail.com';

global.gp1 = global.groupLink;
global.comunidad1 = global.communityLink;
global.channel = global.channelLink;
global.md = global.gitHubRepo;

global.newsChannels = {
    primary: '120363401404146384@newsletter',
};

global.rcanal = {
    contextInfo: {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363401404146384@newsletter',
            serverMessageId: 100,
            newsletterName: 'DEMITRA BOT'
        }
    }
};

global.ch = {
    ch1: '120363401404146384@newsletter',
};

global.apiConfigs = {
    stellar: { baseUrl: 'https://api.stellarwa.xyz', key: 'YukiWaBot', extraKey: '1bcd4698ce6c75217275c9607f01fd99' },
    xyro: { baseUrl: 'https://api.xyro.site', key: null },
    yupra: { baseUrl: 'https://api.yupra.my.id', key: null },
    vreden: { baseUrl: 'https://api.vreden.web.id', key: null },
    delirius: { baseUrl: 'https://api.delirius.store', key: null },
    siputzx: { baseUrl: 'https://api.siputzx.my.id', key: null },
    nekolabs: { baseUrl: 'https://api.nekolabs.web.id', key: null },
    ootaizumi: { baseUrl: 'https://api.ootaizumi.web.id', key: null },
    apifaa: { baseUrl: 'https://api-faa.my.id', key: null },
};

global.api = {
    url: 'https://api.stellarwa.xyz',
    key: 'YukiWaBot'
};

global.APIs = {
    stellar: 'https://api.stellarwa.xyz',
    xyro: 'https://api.xyro.site',
    yupra: 'https://api.yupra.my.id',
    vreden: 'https://api.vreden.web.id',
    delirius: 'https://api.delirius.store',
    siputzx: 'https://api.siputzx.my.id',
};

global.APIKeys = {
    'https://api.stellarwa.xyz': 'YukiWaBot',
};

global.multiplier = 60;

global.premiumUsers = [];
global.suitTags = [];

global.opts = {
    ...global.opts,
    autoread: true,
    queque: false
};

// Crear carpetas necesarias
for (const dir of ['./Sessions', './Sessions/Owner', './Sessions/SubBots', './Sessions/Subs', global.jadi]) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(chalk.greenBright(`✅ Carpeta ${dir} creada.`));
    }
}

console.log(chalk.greenBright("✅ settings.js cargado correctamente."));

let file = scriptPath;
watchFile(file, () => {
    unwatchFile(file);
    console.log(chalk.redBright("🔄 Update 'settings.js'"));
    import(`${file}?update=${Date.now()}`);
});