// index.js
const express = require("express");
const path = require("path");
const sessionRouter = require("./sessionRouter");

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/', sessionRouter);

app.get('/api', (req, res) => {
  res.send('WhatsApp Bot Session API');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
