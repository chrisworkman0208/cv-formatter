const https = require('https');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GATEWAY_API_KEY = process.env.GATEWAY_API_KEY;
const PORT = process.env.PORT || 3000;

require('http').createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gateway-key, anthropic-version');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const key = req.headers['x-gateway-key'];
  if (key !== GATEWAY_API_KEY) { res.writeHead(401); res.end('Unauthorized'); return; }

  let body = '';
  req.on('data', d => body += d);
  req.on('end', () => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const proxy = https.request(options, r => {
      res.writeHead(r.statusCode, {'Content-Type': 'application/json'});
      r.pipe(res);
    });
    proxy.on('error', e => { res.writeHead(502); res.end(e.message); });
    proxy.write(body);
    proxy.end();
  });
}).listen(PORT, () => console.log('Proxy running on port ' + PORT));
