import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }
const OUTPUT_DIR = path.resolve('public/images/lp2');

const images = [
  {
    id: 'hero',
    prompt: `Professional photograph of a successful Japanese restaurant owner (male, 30s) standing confidently in front of his modern ramen shop at golden hour. He's holding a tablet showing colorful map analytics. Warm natural lighting, shallow depth of field, commercial photography style. The restaurant has warm interior lighting visible through large windows with customers inside.`,
    aspectRatio: '16:9',
  },
  {
    id: 'data-screen',
    prompt: `Professional product photography of a laptop screen showing a beautiful map-based analytics dashboard with colorful heatmap zones, population data cards, and competitor pins on a Japanese city map. Clean modern UI design. Shot from a slight angle on a clean white desk with a coffee cup and notebook. Bright natural daylight.`,
    aspectRatio: '16:9',
  },
  {
    id: 'team-meeting',
    prompt: `Professional photograph of a small Japanese business team (3 people) gathered around a laptop in a bright modern cafe, looking at map analytics on screen and smiling. One person pointing at the screen. Natural daylight, warm tones, authentic candid feel. Commercial lifestyle photography.`,
    aspectRatio: '16:9',
  },
  {
    id: 'busy-restaurant',
    prompt: `Professional photograph of a busy Japanese restaurant interior at dinner time, warm atmospheric lighting, happy customers eating ramen at the counter. Steam rising from bowls. The chef is smiling behind the counter. Authentic atmosphere, editorial food photography style.`,
    aspectRatio: '16:9',
  },
  {
    id: 'beauty-salon',
    prompt: `Professional photograph of a modern Japanese beauty salon interior. A female salon owner (30s, stylish) is showing her tablet to a colleague, the screen displays a map with customer analysis. Bright, clean, modern interior with mirrors and professional equipment. Commercial photography.`,
    aspectRatio: '16:9',
  },
  {
    id: 'phone-app',
    prompt: `Professional product photograph of a hand holding a smartphone showing a map-based area marketing app with colorful zones and analytics. The background is a blurred Japanese shopping street (shotengai) with warm bokeh lights. Clean and modern, commercial style.`,
    aspectRatio: '9:16',
  },
  {
    id: 'success-graph',
    prompt: `Professional photograph of a printed business report on a clean desk showing upward trending graphs and pie charts with green and blue colors. A pen and coffee cup nearby. Japanese text visible on headers. Bright natural office lighting, top-down flat lay photography.`,
    aspectRatio: '1:1',
  },
  {
    id: 'storefront',
    prompt: `Professional photograph of a charming Japanese shopping street (shotengai) during daytime. Multiple small shops with colorful signage - a bakery, a flower shop, a small restaurant. Warm sunlight, friendly and prosperous atmosphere. People walking and shopping. Travel photography style.`,
    aspectRatio: '16:9',
  },
];

async function generateImage(prompt, outputPath, aspectRatio = '16:9') {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        safetyFilterLevel: 'block_few',
      },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/imagen-4.0-generate-001:predict?key=${API_KEY}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.predictions?.[0]?.bytesBase64Encoded) {
            const imgBuffer = Buffer.from(json.predictions[0].bytesBase64Encoded, 'base64');
            fs.writeFileSync(outputPath, imgBuffer);
            resolve(true);
          } else {
            console.error('No image:', JSON.stringify(json).slice(0, 500));
            reject(new Error('No image data'));
          }
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`📸 LP2 実写風画像生成 (${images.length}枚)\n`);

  for (const img of images) {
    const outputPath = path.join(OUTPUT_DIR, `${img.id}.png`);
    if (fs.existsSync(outputPath)) { console.log(`✓ skip: ${img.id}.png`); continue; }
    console.log(`⏳ ${img.id}...`);
    try {
      await generateImage(img.prompt, outputPath, img.aspectRatio);
      console.log(`✅ ${img.id}.png`);
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) { console.error(`❌ ${img.id} - ${err.message}`); }
  }
  console.log('\n🎉 Complete!');
}

main();
