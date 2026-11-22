const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state, browser: ['MibotMF', 'Chrome', '1.0'], syncFullHistory: false });
  sock.ev.on('creds.update', saveCreds);

  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode("50247820557");
        console.log('TU CODIGO ES: ' + code);
        console.log('Metelo en WhatsApp del 47820557');
      } catch (e) {
        console.log('Error pidiendo codigo, reiniciando...', e.message);
      }
    }, 4000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) start();
    } else if (connection === 'open') {
      console.log('BOT CONECTADO YA!');
    }
  });
  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    const from = msg.key.remoteJid;
    if (text === '.menu') await sock.sendMessage(from, { text: '🤖 MI BOT MF Ya jalo!' });
  });
}
start();
