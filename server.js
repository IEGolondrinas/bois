const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.static(__dirname, {
  extensions: ['html']
}));

app.get('*', (req, res) => {
  if (/\.(?:js|mjs|css|map|json|png|jpg|jpeg|webp|svg|ico|woff2?|mp3|ogg|wav)$/i.test(req.path)) {
    return res.status(404).type('text/plain').send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`BOIS.IO server listening at http://${HOST}:${PORT}`);
});
