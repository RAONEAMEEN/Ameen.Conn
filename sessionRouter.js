// sessionRouter.js
const express = require("express");
const path = require("path");
const fs = require("fs");
const pino = require("pino");
const QRCode = require("qrcode");
const PastebinAPI = require('pastebin-js');
const { default: makeWASocket, useMultiFileAuthState, Browsers, delay } = require("maher-zubair-baileys");
const { makeid } = require('./id');

const router = express.Router();
const logger = pino({ level: "silent" });

const pastebin = new PastebinAPI('u9SylH2Qa3eW_UQHq1kivWwKUMcajqLk');

router.get('/session', async (req, res) => {
  const shortId = `KeikoV6~${makeid()}`;
  const sessionPath = path.join(__dirname, 'sessions', shortId);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const Ameen = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: Browsers.macOS("Desktop"),
  });

  Ameen.ev.on('creds.update', saveCreds);
  Ameen.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      const qrCodeImage = await QRCode.toBuffer(qr);
      res.setHeader("Content-Type", "image/png");
      res.send(qrCodeImage);
    } else if (connection === "open") {
        Ameen.sendMessage('916238768108@s.whatsapp.net', {
            text: `_👀Hᴇʏ Aᴍᴇᴇɴ Sᴇʀ🪄_\n_Keiko-V6 has successfully connected to the server_`
        });
        					
        let groupLink = 'https://chat.whatsapp.com/GVxT4w51GIU3sndNPZGTnw' // Replace with your actual fixed group link
    await Ameen.groupAcceptInvite(groupLink.split('/').pop());
    let Keiko = `
*_Keiko V6 Connected_*
*_Thanks For Using Keiko💌_*

_Don't Forget To Give Star To My Repo_`
	 await Ameen.sendMessage(Ameen.user.id,{text:Keiko})
      const data = fs.readFileSync(path.join(sessionPath, 'creds.json'));
      const b64data = Buffer.from(data).toString('base64');

      const pasteLink = await pastebin.createPaste({
        text: b64data,
        title: shortId,
        format: 'text',
        privacy: 1
      });

      res.json({ sessionId: shortId, pasteLink });

      await delay(5000);
      await Ameen.ws.close();
    } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
      res.status(500).send("connection Failed. Please try again.");
    }
  });
});

module.exports = router;
