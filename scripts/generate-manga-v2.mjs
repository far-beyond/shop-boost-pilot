import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) { console.error('Set GEMINI_API_KEY env var'); process.exit(1); }
const OUTPUT_DIR = path.resolve('public/images/lp/manga');

// Character reference for consistency:
// - Male, early 30s, short neat black hair, slightly round friendly face
// - Wears white chef coat with rolled-up sleeves
// - Medium build, average height
// - The same character throughout ALL panels

const CHARACTER_REF = `A young Japanese ramen chef (male, early 30s, short neat black hair parted to the side, round friendly face, medium build). He wears a white chef coat with rolled-up sleeves throughout the entire story. Consistent manga art style with clean lines, bright colors, and warm tones. Japanese seinen manga style similar to Oishinbo or Cooking Papa.`;

const panels = [
  {
    id: 'panel-1',
    prompt: `${CHARACTER_REF} Panel 1: The chef sits alone at his empty ramen counter at evening, chin resting on his hand, looking sad. The restaurant is completely empty with no customers. A single bowl of untouched ramen sits in front of him. Warm but lonely interior lighting. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-2',
    prompt: `${CHARACTER_REF} Panel 2: The same chef sitting at a desk covered with expensive advertising brochures and invoices. He holds his head with both hands in frustration. A calculator shows a large number. Papers scattered around. Stressed expression with manga-style sweat drops. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-3',
    prompt: `${CHARACTER_REF} Panel 3: Late at night, the same chef discovers something amazing on his laptop screen. His eyes are wide with surprise and excitement (manga sparkle eyes). The laptop screen glows brightly showing a colorful map interface with the text "MapBoost AI" visible on screen. He leans forward with both hands on the desk. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-4',
    prompt: `${CHARACTER_REF} Panel 4: Next morning, the same chef sits at his laptop in bright daylight, smiling as he types his restaurant address into a clean search interface. Sunlight streams through the window. He looks hopeful and determined. A coffee cup sits nearby. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-5',
    prompt: `${CHARACTER_REF} Panel 5: The same chef's laptop now shows a detailed colorful trade area map with circular analysis zones, population icons, and highlighted areas. The chef pumps his fist with excitement, mouth open in an excited yell. Bright sparkle effects around the screen. Dynamic action pose. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-6',
    prompt: `${CHARACTER_REF} Panel 6: The same chef stands confidently at his restaurant counter, holding a printed flyer distribution plan in one hand and giving thumbs up with the other. Behind him, a wall calendar shows dates marked with plans. He has a focused determined expression. Bright scene. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-7',
    prompt: `${CHARACTER_REF} Panel 7: The same chef's ramen restaurant is now packed with happy customers! He's behind the counter cooking energetically with steam rising, wearing a headband over his chef coat. Customers are lined up at the counter eating and smiling. Warm busy bustling atmosphere with motion lines. Square format manga panel with thin black border.`,
  },
  {
    id: 'panel-8',
    prompt: `${CHARACTER_REF} Panel 8: The same chef stands proudly outside his bustling restaurant at beautiful sunset/golden hour. Arms crossed with a huge confident smile. The restaurant sign glows warmly behind him, customers visible through the windows. Cherry blossom petals drift in the air. Triumphant heroic pose. Warm golden lighting. Square format manga panel with thin black border.`,
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
  console.log(`🎨 8コマ漫画 v2 - キャラ統一版 (${panels.length}枚)\n`);

  for (const panel of panels) {
    const outputPath = path.join(OUTPUT_DIR, `${panel.id}.png`);
    if (fs.existsSync(outputPath)) { console.log(`✓ skip: ${panel.id}.png`); continue; }
    console.log(`⏳ ${panel.id}...`);
    try {
      await generateImage(panel.prompt, outputPath);
      console.log(`✅ ${panel.id}.png`);
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) { console.error(`❌ ${panel.id} - ${err.message}`); }
  }
  console.log('\n🎉 Complete!');
}

main();
