/**
 * Pre-generate all game images using the Gemini API.
 * Saves them as static PNG files in assets/images/.
 *
 * Usage: node scripts/generate-images.mjs
 *
 * Resumable: skips images that already exist on disk.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load API key from .env
const envFile = fs.readFileSync(path.join(ROOT, '.env'), 'utf-8');
const API_KEY = envFile.match(/EXPO_PUBLIC_GEMINI_API_KEY=(.+)/)?.[1]?.trim();
if (!API_KEY) {
  console.error('No API key found in .env');
  process.exit(1);
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${API_KEY}`;

const EVENTS_DIR = path.join(ROOT, 'assets/images/events');
const UI_DIR = path.join(ROOT, 'assets/images/ui');

fs.mkdirSync(EVENTS_DIR, { recursive: true });
fs.mkdirSync(UI_DIR, { recursive: true });

// Delay between requests (ms)
const DELAY = 8000;

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function generateImage(prompt, outputPath, label, retries = 3) {
  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    console.log(`  [SKIP] ${label} (already exists)`);
    return true;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
        }),
      });

      if (res.status === 429) {
        const backoff = attempt * 15000;
        console.log(`  [429] Rate limited on ${label}, waiting ${backoff / 1000}s (attempt ${attempt}/${retries})`);
        await sleep(backoff);
        continue;
      }

      if (!res.ok) {
        console.error(`  [ERROR] ${label}: ${res.status} ${res.statusText}`);
        if (attempt < retries) {
          await sleep(5000);
          continue;
        }
        return false;
      }

      const data = await res.json();
      const parts = data.candidates?.[0]?.content?.parts;
      const imagePart = parts?.find(p => p.inlineData?.data);

      if (!imagePart?.inlineData?.data) {
        console.error(`  [ERROR] ${label}: No image data in response`);
        if (attempt < retries) {
          await sleep(5000);
          continue;
        }
        return false;
      }

      // Save as PNG
      const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
      fs.writeFileSync(outputPath, buffer);
      console.log(`  [OK] ${label} (${(buffer.length / 1024).toFixed(0)} KB)`);
      return true;
    } catch (err) {
      console.error(`  [ERROR] ${label}: ${err.message}`);
      if (attempt < retries) {
        await sleep(5000);
        continue;
      }
      return false;
    }
  }
  return false;
}

// Extract event data by reading the TS file and parsing with regex
function loadEvents() {
  const eventsFile = fs.readFileSync(path.join(ROOT, 'src/data/events.ts'), 'utf-8');
  const events = [];

  // Match each event object's id and imagePrompt
  const idRegex = /id:\s*(\d+)/g;
  const promptRegex = /imagePrompt:\s*'((?:[^'\\]|\\.)*)'/g;

  const ids = [];
  let match;
  while ((match = idRegex.exec(eventsFile)) !== null) {
    ids.push(parseInt(match[1]));
  }

  const prompts = [];
  while ((match = promptRegex.exec(eventsFile)) !== null) {
    // Unescape the string
    prompts.push(match[1].replace(/\\'/g, "'").replace(/\\n/g, "\n").replace(/\\u00B0/g, "°"));
  }

  for (let i = 0; i < ids.length; i++) {
    events.push({ id: ids[i], prompt: prompts[i] });
  }

  return events;
}

// UI image prompts
const UI_IMAGES = [
  {
    name: 'home_bg',
    prompt: 'Present a clear, 45 degree top-down isometric miniature 3D cartoon scene of a world history montage featuring tiny iconic landmarks from different eras: Egyptian pyramids, Roman Colosseum, medieval castle, sailing ship, and a space rocket, all arranged in a miniature diorama. Use soft, refined textures with realistic PBR materials and gentle, warm golden-hour lighting and shadows. Create an immersive atmospheric mood with soft clouds. Use a clean, minimalistic composition with a soft warm peach-to-sky-blue gradient background. Wide panoramic 1920x600 dimension.',
  },
  {
    name: 'world_map',
    prompt: 'A beautiful stylized illustrated world map with a vintage antique parchment aesthetic, showing all continents with soft watercolor textures in warm earth tones (tan, sienna, olive). Include subtle compass rose, dotted maritime trade routes, tiny illustrated landmarks (pyramids, colosseum, great wall, statue of liberty), decorative cartographic borders with ornamental corners. Soft warm lighting, old-world explorer aesthetic. Wide format 1200x700, no text labels.',
  },
  {
    name: 'mode_classic',
    prompt: 'A stylized 3D icon of a vintage photograph frame with a glowing golden border, a tiny landscape painting inside showing ancient ruins, floating on a soft orange gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  },
  {
    name: 'mode_timed',
    prompt: 'A stylized 3D icon of a futuristic hourglass with purple glowing sand particles flowing inside, electric sparks around it, floating on a soft purple gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  },
  {
    name: 'mode_timeline',
    prompt: 'A stylized 3D icon of a vertical timeline with colorful event nodes connected by a glowing blue ribbon, tiny historical symbols at each node, floating on a soft blue gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  },
  {
    name: 'mode_daily',
    prompt: 'A stylized 3D icon of a treasure chest calendar with a golden star bursting out, pink sparkles and confetti, floating on a soft pink gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  },
  {
    name: 'mode_era_explorer',
    prompt: 'A stylized 3D icon of a compass overlaid on ancient scrolls with era symbols (pyramid, castle, rocket) orbiting around it, floating on a soft dark-orange gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  },
  {
    name: 'mode_map_quest',
    prompt: 'A stylized 3D icon of a treasure map with a glowing location pin, tiny ocean waves and continent shapes, floating on a soft teal gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  },
  {
    name: 'mascot_explorer_m1',
    prompt: 'A friendly cartoon portrait of a young male explorer named Marco with warm brown skin, wearing a tan safari hat and orange adventure vest, confident smile, warm golden background, soft 3D cartoon style, bust portrait, 512x512',
  },
  {
    name: 'mascot_explorer_m2',
    prompt: 'A friendly cartoon portrait of a scholarly young man named Atlas with glasses and dark hair, wearing a graduation cap and blue academic robe, curious expression, soft blue background, soft 3D cartoon style, bust portrait, 512x512',
  },
  {
    name: 'mascot_explorer_f1',
    prompt: 'A friendly cartoon portrait of a young female scientist named Cleo with curly dark hair, wearing a lab coat with a pink scarf, intelligent smile, soft pink background, soft 3D cartoon style, bust portrait, 512x512',
  },
  {
    name: 'mascot_explorer_f2',
    prompt: 'A friendly cartoon portrait of a wise young woman named Athena wearing a purple headscarf and golden earrings, thoughtful expression, soft purple background, soft 3D cartoon style, bust portrait, 512x512',
  },
];

async function main() {
  console.log('=== Image Generation Script ===\n');

  // Phase 1: UI images
  console.log(`--- Phase 1: UI Images (${UI_IMAGES.length}) ---`);
  let uiOk = 0;
  for (let i = 0; i < UI_IMAGES.length; i++) {
    const img = UI_IMAGES[i];
    const outPath = path.join(UI_DIR, `${img.name}.png`);
    const ok = await generateImage(img.prompt, outPath, img.name);
    if (ok) uiOk++;
    if (i < UI_IMAGES.length - 1) await sleep(DELAY);
  }
  console.log(`\nUI images: ${uiOk}/${UI_IMAGES.length} generated\n`);

  // Phase 2: Event images
  const events = loadEvents();
  console.log(`--- Phase 2: Event Images (${events.length}) ---`);
  let evOk = 0;
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const outPath = path.join(EVENTS_DIR, `event_${ev.id}.png`);
    const ok = await generateImage(ev.prompt, outPath, `Event ${ev.id}`);
    if (ok) evOk++;
    if (i < events.length - 1) await sleep(DELAY);
  }
  console.log(`\nEvent images: ${evOk}/${events.length} generated`);
  console.log(`\n=== Done! Total: ${uiOk + evOk}/${UI_IMAGES.length + events.length} ===`);
}

main().catch(console.error);
