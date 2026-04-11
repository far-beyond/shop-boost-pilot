import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }
const OUTPUT_DIR = path.resolve('public/images/lp');

const images = [
  {
    id: 'hero',
    prompt: `A cheerful young Japanese restaurant owner (male, 30s, wearing a white chef coat and apron) holding a tablet showing a colorful map with data analytics overlays. Behind him is a cozy ramen shop interior. Bright and optimistic atmosphere. Modern Japanese manga/anime illustration style with clean lines and vibrant colors. Wide composition, no text or speech bubbles.`,
    aspectRatio: '16:9',
  },
  {
    id: 'pain-point',
    prompt: `A stressed Japanese small business owner (female, 40s, beauty salon owner wearing stylish outfit) sitting at a desk surrounded by scattered papers, invoices, and a calculator. She has a worried expression with sweat drops (manga style). A stack of advertising bills shows large numbers. Japanese manga/comic style illustration with expressive emotions. Square composition, no text.`,
    aspectRatio: '1:1',
  },
  {
    id: 'solution',
    prompt: `A happy Japanese cafe owner (female, 30s, wearing a cafe apron) looking at a large screen showing a beautiful map with colorful zone highlights and upward-trending graphs. The atmosphere is bright and hopeful with sparkle effects. Customers are visible in the background of the cafe. Modern Japanese anime illustration style. Wide composition, no text.`,
    aspectRatio: '16:9',
  },
  {
    id: 'feature-map',
    prompt: `A bird's eye view illustration of a Japanese city neighborhood with a glowing circular radius overlay centered on a shop location. Small icons float above showing population numbers, competitor pins, and household data. Clean modern infographic-meets-anime style illustration with blue and teal color scheme. Square composition, no text.`,
    aspectRatio: '1:1',
  },
  {
    id: 'feature-flyer',
    prompt: `A Japanese business owner confidently holding a professional-looking printed flyer/pamphlet while standing next to a digital screen showing a distribution map. The flyer design is visible and colorful. Modern Japanese illustration style, clean and professional. Square composition, no text.`,
    aspectRatio: '1:1',
  },
  {
    id: 'feature-ad',
    prompt: `A split-screen illustration: left side shows Google search results page, right side shows a social media feed with an advertisement. In the center, a friendly AI robot character is connecting both screens with glowing lines. Modern Japanese kawaii-tech illustration style with blue gradient background. Square composition, no text.`,
    aspectRatio: '1:1',
  },
  {
    id: 'feature-meo',
    prompt: `A smartphone screen showing Google Maps with a shop listing highlighted at the #1 position with 5 gold stars. A happy Japanese shop owner is peeking from behind the phone giving a thumbs up. Confetti and celebration effects around. Bright and cheerful Japanese manga illustration style. Square composition, no text.`,
    aspectRatio: '1:1',
  },
  {
    id: 'before-after',
    prompt: `A two-panel manga illustration. LEFT panel (dark/gloomy): A tired Japanese restaurant owner alone in an empty restaurant looking sad, with cobwebs and empty seats. RIGHT panel (bright/cheerful): The same owner in a packed busy restaurant full of happy customers, the owner is smiling with arms spread wide. Japanese manga style with clear contrast between panels. Wide composition, no text or speech bubbles.`,
    aspectRatio: '16:9',
  },
  {
    id: 'testimonial-bg',
    prompt: `A soft, warm background illustration of a successful Japanese shopping street (shotengai) with various small shops - ramen shop, beauty salon, dental clinic - all looking busy and prosperous. Gentle watercolor-meets-anime style with pastel colors and soft lighting. Wide composition, no text, suitable as a background image.`,
    aspectRatio: '16:9',
  },
  {
    id: 'cta-bg',
    prompt: `An inspiring aerial view illustration of a Japanese city at sunset with glowing data visualization overlays - circles, connection lines, and heatmap zones in blue and teal colors floating above the cityscape. Futuristic yet warm atmosphere. Modern digital art style. Wide composition, no text.`,
    aspectRatio: '16:9',
  },
  {
    id: 'banner-character',
    prompt: `A confident young Japanese business consultant character (male, late 20s, wearing a sharp navy suit with loosened tie, friendly smile) pointing forward at the viewer in a dynamic pose. Clean white/transparent background. Modern Japanese anime/manga character design, full body shot. Portrait composition, no text.`,
    aspectRatio: '3:4',
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
            console.error('No image in response:', JSON.stringify(json).slice(0, 500));
            reject(new Error('No image data'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`🎨 MapBoost LP画像生成 (${images.length}枚)`);
  console.log(`📁 出力先: ${OUTPUT_DIR}\n`);

  for (const img of images) {
    const outputPath = path.join(OUTPUT_DIR, `${img.id}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`✓ skip: ${img.id}.png (already exists)`);
      continue;
    }
    console.log(`⏳ Generating: ${img.id}...`);
    try {
      await generateImage(img.prompt, outputPath, img.aspectRatio);
      console.log(`✅ Done: ${img.id}.png`);
      // Rate limit: wait 3 seconds between requests
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`❌ Failed: ${img.id} - ${err.message}`);
    }
  }
  console.log('\n🎉 Complete!');
}

main();
