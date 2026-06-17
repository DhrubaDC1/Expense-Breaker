// Plain CJS, zero imports – if this fails the issue is the Vercel project setup, not the code
module.exports = (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ test: 'ok', ts: new Date().toISOString() }));
};
