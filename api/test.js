export default function handler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ test: 'ok', ts: new Date().toISOString() }));
}
