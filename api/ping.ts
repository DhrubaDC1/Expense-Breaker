export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ pong: true, ts: new Date().toISOString() }));
}
