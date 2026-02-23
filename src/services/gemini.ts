import AsyncStorage from '@react-native-async-storage/async-storage';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`;

const IMAGE_CACHE_PREFIX = 'img_v2_';

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: GeminiPart[];
    };
  }>;
}

function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    hash = ((hash << 5) - hash + prompt.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

async function callGeminiImageAPI(prompt: string): Promise<string | null> {
  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: GeminiResponse = await response.json();

    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.error('Gemini API returned no parts');
      return null;
    }

    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      console.error('Gemini API returned no image data');
      return null;
    }

    return imagePart.inlineData.data;
  } catch (error) {
    console.error('Failed to generate image:', error);
    return null;
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
  const cacheKey = IMAGE_CACHE_PREFIX + hashPrompt(prompt);

  // Check cache first for instant loading
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  } catch {
    // Cache miss, continue to generate
  }

  const base64Data = await callGeminiImageAPI(prompt);
  if (!base64Data) return null;

  // Cache the result (fire and forget)
  try {
    await AsyncStorage.setItem(cacheKey, base64Data);
  } catch {
    // Storage full or unavailable, still return the image
  }

  return base64Data;
}

/** Generate and cache a themed background image for the home screen */
export async function generateHomeBackground(): Promise<string | null> {
  const CACHE_KEY = 'home_bg_v2';

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return cached;
  } catch {}

  const prompt =
    'Present a clear, 45 degree top-down isometric miniature 3D cartoon scene of a world history montage featuring tiny iconic landmarks from different eras: Egyptian pyramids, Roman Colosseum, medieval castle, sailing ship, and a space rocket, all arranged in a miniature diorama. Use soft, refined textures with realistic PBR materials and gentle, warm golden-hour lighting and shadows. Create an immersive atmospheric mood with soft clouds. Use a clean, minimalistic composition with a soft warm peach-to-sky-blue gradient background. Wide panoramic 1920x600 dimension.';

  const data = await callGeminiImageAPI(prompt);
  if (data) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, data);
    } catch {}
  }
  return data;
}

/** Mascot prompts for Gemini image generation */
const MASCOT_PROMPTS: Record<string, string> = {
  explorer_m1:
    'A friendly cartoon portrait of a young male explorer named Marco with warm brown skin, wearing a tan safari hat and orange adventure vest, confident smile, warm golden background, soft 3D cartoon style, bust portrait, 512x512',
  explorer_m2:
    'A friendly cartoon portrait of a scholarly young man named Atlas with glasses and dark hair, wearing a graduation cap and blue academic robe, curious expression, soft blue background, soft 3D cartoon style, bust portrait, 512x512',
  explorer_f1:
    'A friendly cartoon portrait of a young female scientist named Cleo with curly dark hair, wearing a lab coat with a pink scarf, intelligent smile, soft pink background, soft 3D cartoon style, bust portrait, 512x512',
  explorer_f2:
    'A friendly cartoon portrait of a wise young woman named Athena wearing a purple headscarf and golden earrings, thoughtful expression, soft purple background, soft 3D cartoon style, bust portrait, 512x512',
};

/** Generate and cache a mascot avatar image */
export async function generateMascotImage(mascotId: string): Promise<string | null> {
  const CACHE_KEY = `mascot_v2_${mascotId}`;

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return cached;
  } catch {}

  const prompt = MASCOT_PROMPTS[mascotId];
  if (!prompt) return null;

  const data = await callGeminiImageAPI(prompt);
  if (data) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, data);
    } catch {}
  }
  return data;
}

/** Game mode icon prompts for Gemini generation */
const GAME_MODE_ICON_PROMPTS: Record<string, string> = {
  classic:
    'A stylized 3D icon of a vintage photograph frame with a glowing golden border, a tiny landscape painting inside showing ancient ruins, floating on a soft orange gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  timed:
    'A stylized 3D icon of a futuristic hourglass with purple glowing sand particles flowing inside, electric sparks around it, floating on a soft purple gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  timeline:
    'A stylized 3D icon of a vertical timeline with colorful event nodes connected by a glowing blue ribbon, tiny historical symbols at each node, floating on a soft blue gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  daily:
    'A stylized 3D icon of a treasure chest calendar with a golden star bursting out, pink sparkles and confetti, floating on a soft pink gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  era_explorer:
    'A stylized 3D icon of a compass overlaid on ancient scrolls with era symbols (pyramid, castle, rocket) orbiting around it, floating on a soft dark-orange gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
  map_quest:
    'A stylized 3D icon of a treasure map with a glowing location pin, tiny ocean waves and continent shapes, floating on a soft teal gradient background. Miniature, glossy, game-app icon style, 256x256, no text.',
};

/** Generate and cache a game mode icon image */
export async function generateGameModeIcon(modeId: string): Promise<string | null> {
  const CACHE_KEY = `mode_icon_v1_${modeId}`;

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return cached;
  } catch {}

  const prompt = GAME_MODE_ICON_PROMPTS[modeId];
  if (!prompt) return null;

  const data = await callGeminiImageAPI(prompt);
  if (data) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, data);
    } catch {}
  }
  return data;
}

/** Generate and cache a stylized world map image */
export async function generateWorldMapImage(): Promise<string | null> {
  const CACHE_KEY = 'world_map_v1';

  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) return cached;
  } catch {}

  const prompt =
    'A beautiful stylized illustrated world map with a vintage antique parchment aesthetic, showing all continents with soft watercolor textures in warm earth tones (tan, sienna, olive). Include subtle compass rose, dotted maritime trade routes, tiny illustrated landmarks (pyramids, colosseum, great wall, statue of liberty), decorative cartographic borders with ornamental corners. Soft warm lighting, old-world explorer aesthetic. Wide format 1200x700, no text labels.';

  const data = await callGeminiImageAPI(prompt);
  if (data) {
    try {
      await AsyncStorage.setItem(CACHE_KEY, data);
    } catch {}
  }
  return data;
}

/** Pre-generate all static images on app startup for instant loading */
export async function preGenerateAllImages(): Promise<void> {
  if (!isGeminiConfigured()) return;

  // Run all generations concurrently
  const tasks: Promise<unknown>[] = [
    generateHomeBackground(),
    generateWorldMapImage(),
    ...Object.keys(GAME_MODE_ICON_PROMPTS).map((modeId) => generateGameModeIcon(modeId)),
  ];

  // Fire and forget - don't block the app
  Promise.allSettled(tasks).then((results) => {
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`Pre-generated ${succeeded}/${results.length} images`);
  });
}
