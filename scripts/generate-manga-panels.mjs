import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }
const OUTPUT_DIR = path.resolve('public/images/lp/manga');

const panels = [
  {
    id: 'panel-1',
    prompt: `Japanese manga panel: A tired Japanese ramen shop owner (male, 30s, wearing chef coat) sitting alone in an empty restaurant at evening, looking at his phone. One empty bowl on counter. Worried expression. Warm indoor lighting but lonely atmosphere. Clean manga style with screen tones. No text or speech bubbles. Bright clean art style.`,
  },
  {
    id: 'panel-2',
    prompt: `Japanese manga panel: The same ramen shop owner looking frustrated while comparing stacks of advertising flyers and brochures from expensive ad agencies on his desk. Price tags showing high numbers. Sweat drops on his face. Clean manga art style, expressive. No text or speech bubbles.`,
  },
  {
    id: 'panel-3',
    prompt: `Japanese manga panel: The ramen shop owner discovers MapBoost AI on his laptop screen late at night, eyes wide with surprise and interest, sparkle effects around the screen showing a colorful map interface. Bright hopeful atmosphere starting. Clean manga style. No text or speech bubbles.`,
  },
  {
    id: 'panel-4',
    prompt: `Japanese manga panel: The ramen shop owner happily typing his shop address into a clean web interface on his laptop. The screen shows a simple search bar. He looks excited and hopeful. Bright daytime scene with sunlight. Clean cheerful manga style. No text or speech bubbles.`,
  },
  {
    id: 'panel-5',
    prompt: `Japanese manga panel: A colorful map appears on the laptop screen showing a trade area analysis with circular zones, population data icons, and competitor pins. The shop owner is amazed with sparkle eyes, leaning forward. Bright cheerful scene. Clean manga style. No text or speech bubbles.`,
  },
  {
    id: 'panel-6',
    prompt: `Japanese manga panel: The ramen shop owner confidently pointing at a printed flyer distribution plan map on a table, while talking on the phone to order flyer printing. He looks determined and professional. Bright office scene. Clean manga style. No text or speech bubbles.`,
  },
  {
    id: 'panel-7',
    prompt: `Japanese manga panel: The ramen shop now has a line of happy customers waiting outside. The owner peeks out from the kitchen with a big smile, wiping sweat of hard work (not stress). Warm bright bustling atmosphere with steam from cooking. Clean manga style. No text or speech bubbles.`,
  },
  {
    id: 'panel-8',
    prompt: `Japanese manga panel: The ramen shop owner standing proudly outside his busy restaurant at golden hour sunset, arms crossed with a confident smile. The shop sign is bright and welcoming, many customers visible inside. Cherry blossom petals floating. Triumphant bright atmosphere. Clean manga style. No text or speech bubbles.`,
  },
];

async function generateImage(prompt, outputPath) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      instances: [{ prompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio: '1:1',
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

  console.log(`🎨 8コマ漫画生成 (${panels.length}枚)`);
  console.log(`📁 出力先: ${OUTPUT_DIR}\n`);

  for (const panel of panels) {
    const outputPath = path.join(OUTPUT_DIR, `${panel.id}.png`);
    if (fs.existsSync(outputPath)) {
      console.log(`✓ skip: ${panel.id}.png (already exists)`);
      continue;
    }
    console.log(`⏳ Generating: ${panel.id}...`);
    try {
      await generateImage(panel.prompt, outputPath);
      console.log(`✅ Done: ${panel.id}.png`);
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`❌ Failed: ${panel.id} - ${err.message}`);
    }
  }
  console.log('\n🎉 Complete!');
}

main();
