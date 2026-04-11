import https from 'https';
import fs from 'fs';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1); }

const prompt = `Professional photograph of a confident young Japanese restaurant owner (male, early 30s, wearing a black chef jacket) standing in front of a modern restaurant with warm interior lighting visible through large windows. He holds a tablet showing colorful map analytics. Golden hour natural lighting, shallow depth of field, commercial photography style. NO text, NO signage with Japanese characters, NO visible words on any signs or surfaces. Clean minimalist restaurant exterior.`;

const body = JSON.stringify({
  instances: [{ prompt }],
  parameters: { sampleCount: 1, aspectRatio: '16:9', safetyFilterLevel: 'block_few' },
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if (json.predictions?.[0]?.bytesBase64Encoded) {
      fs.writeFileSync('public/images/lp2/hero.png', Buffer.from(json.predictions[0].bytesBase64Encoded, 'base64'));
      console.log('✅ hero.png regenerated');
    } else {
      console.error('Failed:', JSON.stringify(json).slice(0, 300));
    }
  });
});
req.on('error', e => console.error(e));
req.write(body);
req.end();
