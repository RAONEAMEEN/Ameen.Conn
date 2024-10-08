const express = require("express");
const pino = require("pino");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const PastebinAPI = require("pastebin-js");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers,
  delay,
} = require("@whiskeysockets/baileys");

const app = express();
const logger = pino({ level: "silent" });
const pastebin = new PastebinAPI('u9SylH2Qa3eW_UQHq1kivWwKUMcajqLk'); 

// Random Sid Make
function makeid(length = 8) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// Endpoint 😹
app.get('/', async (req, res) => {
  const sessionId = "Keiko~" + makeid();
  const sessionDir = path.join(__dirname, 'sessions', sessionId);

  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  try {
    const Ameen = makeWASocket({
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: Browsers.macOS("Desktop"),
    });

    Ameen.ev.on('connection.update', async (update) => {
      const { connection, qr } = update;

      if (connection === "open") {
        // Encode session data in Base64 and store it in Pastebin
        const credsData = fs.readFileSync(path.join(sessionDir, 'creds.json'));
        const base64Creds = Buffer.from(credsData).toString('base64');
        const pasteUrl = await pastebin.createPaste({
          text: base64Creds,
          title: sessionId,
          format: 'text',
          privacy: 1
        });

        console.log(`Session ID stored at: ${pasteUrl}`);

        // Send session ID to the user's own PM
        await Ameen.sendMessage(Ameen.user.id, { text: `Your session ID is: ${sessionId}\nStored at: ${pasteUrl}` });

        // Optional: Send a custom message to the user
        await Ameen.sendMessage(Ameen.user.id, { text: `_👀Hey!_\n_Ameen has successfully connected._` });

        // Close the connection and clean up
        await delay(100);
        await Ameen.ws.close();
        removeSessionDir(sessionDir);

        if (!res.headersSent) {
          res.send('QR code has been generated and session ID has been stored.');
        }
      } else if (qr) {
        // Generate and send QR code as an image
        const qrCodeBuffer = await QRCode.toBuffer(qr);
        if (!res.headersSent) {
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': qrCodeBuffer.length
          });
          res.end(qrCodeBuffer);
        }
      }
    });

    Ameen.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error("Error occurred during session creation:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

// Helper function to remove session directory
function removeSessionDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
      
