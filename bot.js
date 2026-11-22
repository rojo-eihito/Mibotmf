const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state, browser: ['MibotMF', 'Chrome', '1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('=== ESCANEA ESTE QR CON TU SEGUNDO NUMERO ===');
      qrcode.generate(qr, { small: true });
    }
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
    if (text === '.menu') {
      await sock.sendMessage(from, { text: '🤖 *MI BOT MF* \n\n.menu - ver menu\n.hola - saludar\n\nYa jalo!' });
    }
    if (text === '.hola') {
      await sock.sendMessage(from, { text: 'Que onda, ya jalo el bot!' });
    }
  });
}
start();
