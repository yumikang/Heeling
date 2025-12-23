/**
 * Google Imagen Client
 * AI Image generation using Gemini API
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface ImagenGenerateParams {
  prompt: string;
  numberOfImages?: 1 | 2 | 3 | 4;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
}

export interface GeneratedImage {
  mimeType: string;
  bytesBase64Encoded?: string;
  url?: string;
}

export interface ImagenResponse {
  predictions?: Array<{
    bytesBase64Encoded: string;
    mimeType: string;
  }>;
  error?: {
    code: number;
    message: string;
  };
}

export class ImagenClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(params: ImagenGenerateParams): Promise<GeneratedImage[]> {
    // Imagen 4.0 preview model (current as of Nov 2025)
    const model = 'imagen-4.0-generate-preview-06-06';

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${model}:predict?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: params.prompt,
            },
          ],
          parameters: {
            sampleCount: params.numberOfImages || 1,
            aspectRatio: params.aspectRatio || '1:1',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Imagen API error: ${error.error?.message || response.status}`);
    }

    const data: ImagenResponse = await response.json();

    if (data.error) {
      throw new Error(`Imagen API error: ${data.error.message}`);
    }

    return (data.predictions || []).map(pred => ({
      mimeType: pred.mimeType || 'image/png',
      bytesBase64Encoded: pred.bytesBase64Encoded,
    }));
  }

  /**
   * Generate image and return as base64 data URL
   */
  async generateImageAsDataUrl(params: ImagenGenerateParams): Promise<string[]> {
    const images = await this.generateImage(params);

    return images.map(img => {
      if (img.bytesBase64Encoded) {
        return `data:${img.mimeType};base64,${img.bytesBase64Encoded}`;
      }
      return img.url || '';
    }).filter(Boolean);
  }

  /**
   * Save generated image to file
   */
  async generateAndSave(
    params: ImagenGenerateParams,
    savePath: string
  ): Promise<string> {
    const fs = await import('fs/promises');
    const path = await import('path');

    const images = await this.generateImage(params);

    if (images.length === 0 || !images[0].bytesBase64Encoded) {
      throw new Error('No image generated');
    }

    const buffer = Buffer.from(images[0].bytesBase64Encoded, 'base64');
    const ext = images[0].mimeType.split('/')[1] || 'png';
    const filename = `${Date.now()}-generated.${ext}`;
    const fullPath = path.join(savePath, filename);

    await fs.writeFile(fullPath, buffer);

    return filename;
  }
}

// Art style templates for diverse album artwork
export const ART_STYLES = {
  // 회화 스타일
  watercolor: 'delicate watercolor painting, soft color bleeding, wet-on-wet technique, dreamy washes, artistic brushwork',
  oilPainting: 'rich oil painting, thick impasto brushstrokes, classical art style, dramatic lighting, museum quality',
  impressionist: 'impressionist style like Monet, soft dappled light, vibrant color spots, dreamy atmosphere',
  japanese: 'Japanese ukiyo-e woodblock print style, flat colors, bold outlines, serene composition, Hokusai inspired',
  chinese: 'traditional Chinese ink wash painting, minimalist sumi-e style, bamboo and mountains, Zen aesthetic',
  korean: 'Korean minhwa folk art style, vibrant colors, symbolic elements, traditional patterns, dreamlike',

  // 디지털/모던 스타일
  digital3d: 'stunning 3D render, soft ambient occlusion, subsurface scattering, cinematic lighting, octane render',
  gradient: 'beautiful gradient mesh, smooth color transitions, soft aurora-like colors, modern design',
  glassmorphism: 'glassmorphism design, frosted glass effect, soft blur, iridescent colors, modern UI aesthetic',
  geometric: 'sacred geometry patterns, golden ratio spirals, mandala elements, symmetric design',
  lowPoly: 'low poly art style, faceted surfaces, soft pastel colors, modern minimalist',

  // 사진/리얼리즘
  cinematic: 'cinematic photograph, dramatic lighting, shallow depth of field, anamorphic lens flare, movie poster quality',
  ethereal: 'ethereal photography, soft focus, lens flare, golden hour light, dreamy overexposed',
  macro: 'macro photography style, extreme detail, shallow depth of field, dewdrops, nature close-up',
  aerial: 'aerial landscape photography, drone view, sweeping vistas, dramatic clouds, golden hour',

  // 일러스트레이션
  anime: 'anime art style, soft shading, vibrant colors, Studio Ghibli inspired, peaceful scene',
  lofi: 'lo-fi aesthetic illustration, cozy atmosphere, warm colors, nostalgic mood, late night vibes',
  vintage: 'vintage retro illustration, 1970s album art style, warm color palette, grainy texture',
  botanical: 'botanical illustration, scientific accuracy, delicate details, vintage naturalist style',

  // 추상/아트
  abstract: 'abstract expressionist art, bold color fields, emotional brushwork, Mark Rothko inspired',
  surreal: 'surrealist dreamscape, impossible architecture, floating elements, Salvador Dali inspired',
  minimal: 'minimalist art, single focal point, vast negative space, subtle color, zen simplicity',
};

// Category-specific scene elements
export const CATEGORY_SCENES: Record<string, string[]> = {
  healing: [
    'serene mountain lake at dawn, mirror-like water reflection, mist rising',
    'peaceful meadow with wildflowers, soft morning light filtering through',
    'gentle waterfall in hidden forest grotto, moss-covered rocks',
    'zen garden with raked sand patterns, single cherry blossom tree',
    'hot spring surrounded by snow, steam rising, peaceful solitude',
  ],
  sleep: [
    'crescent moon over calm ocean, stars reflected in water',
    'cozy bedroom with moonlight streaming through curtains',
    'night sky aurora borealis, purple and green dancing lights',
    'floating on clouds under starry sky, peaceful weightlessness',
    'sleeping forest at midnight, fireflies gentle glow, magical twilight',
  ],
  nature: [
    'ancient redwood forest, cathedral of trees, ethereal light rays',
    'tropical rainforest canopy, exotic birds, morning mist',
    'coastal cliffs at sunset, crashing waves, dramatic sky',
    'alpine meadow with wildflowers, snow-capped peaks in distance',
    'bamboo forest path, dappled sunlight, swaying in breeze',
  ],
  focus: [
    'single lotus flower on still pond, perfect symmetry',
    'minimalist sand dunes, clean lines, soft shadows',
    'modern zen office space, clean desk, natural light',
    'geometric crystal formations, light refracting, clarity',
    'single candle flame in darkness, focused light, meditation',
  ],
  cafe: [
    'rainy window view from cozy cafe, warm interior light',
    'vintage coffee shop corner, books and plants, soft afternoon light',
    'parisian cafe terrace, autumn leaves, warm golden hour',
    'japanese kissaten interior, retro aesthetic, peaceful atmosphere',
    'nordic hygge cafe, candles and blankets, snow outside window',
  ],
  meditation: [
    'tibetan temple at sunrise, prayer flags, mountain backdrop',
    'sacred forest clearing, ancient stone circle, mystical light',
    'japanese zen temple garden, perfect balance, autumn colors',
    'crystal cave interior, natural light, spiritual atmosphere',
    'floating meditation pose over calm lake, spiritual transcendence',
  ],
};

// Mood-based color palettes and atmospheres
export const MOOD_ATMOSPHERES: Record<string, string> = {
  calm: 'soft pastel color palette, gentle gradients, peaceful atmosphere, low contrast, soothing tones',
  energetic: 'vibrant warm colors, dynamic composition, bright highlights, energizing atmosphere',
  dreamy: 'soft focus, ethereal glow, pastel colors with purple and pink tints, dreamlike haze',
  focus: 'clean minimal palette, sharp details, clear composition, zen-like clarity',
  melancholy: 'muted blue and gray tones, soft rain atmosphere, gentle sadness, nostalgic feeling',
  uplifting: 'warm golden light, hopeful sunrise colors, ascending elements, inspiring composition',
};

// Healing app - realistic photography style
const HEALING_PHOTO_STYLE = `
  professional photograph,
  realistic and natural,
  high resolution DSLR photo,
  soft natural lighting,
  shallow depth of field,
  peaceful serene atmosphere,
  calming color tones,
  vertical composition for mobile wallpaper
`.trim().replace(/\n\s*/g, ' ');

// Realistic nature scenes for healing app - organized by theme
const HEALING_SCENES: Record<string, string[]> = {
  sky: [
    'vast open sky with soft clouds, peaceful blue horizon, serene atmosphere',
    'dramatic sunset sky with golden and pink clouds, peaceful twilight',
    'clear blue sky with wispy cirrus clouds, endless peaceful expanse',
    'soft pastel sky at dawn, gentle gradient from pink to blue',
    'cloudscape from above, fluffy white clouds, serene aerial view',
  ],
  ocean: [
    'peaceful ocean horizon at golden hour, gentle waves, warm sky colors',
    'calm turquoise sea with gentle ripples, endless peaceful horizon',
    'serene beach at sunrise, soft waves, golden morning light',
    'crystal clear ocean water, soft white sand beneath, tropical peace',
  ],
  forest: [
    'soft morning light through forest trees, sunbeams filtering through leaves',
    'serene bamboo forest path, soft diffused light, zen atmosphere',
    'ancient redwood forest, cathedral of trees, ethereal light rays',
    'misty forest at dawn, soft fog between trees, magical atmosphere',
  ],
  mountain: [
    'misty mountain lake at sunrise, calm water reflection, fog rolling over peaks',
    'mountain meadow with wildflowers, soft clouds, peaceful landscape',
    'snow-capped mountain peaks at golden hour, serene alpine landscape',
    'mountain valley with morning mist, peaceful isolation, majestic peaks',
  ],
  water: [
    'calm river flowing through autumn forest, fallen leaves, tranquil mood',
    'misty waterfall in lush green forest, long exposure smooth water',
    'still pond with lotus flowers, perfect reflection, zen tranquility',
    'gentle stream in moss-covered forest, soothing water sounds',
  ],
  night: [
    'starry night sky over calm lake, milky way reflection, peaceful night',
    'crescent moon over calm ocean, stars reflected in water',
    'aurora borealis dancing over snowy landscape, magical night',
    'peaceful night sky with countless stars, cosmic serenity',
  ],
  flower: [
    'cherry blossom trees by still pond, petals floating, spring serenity',
    'lavender field at sunset, rolling hills, dreamy purple haze',
    'meadow of wildflowers in soft morning light, gentle breeze',
    'single lotus flower on still pond, perfect symmetry, zen beauty',
  ],
  winter: [
    'snow-covered pine forest, soft winter light, peaceful silence',
    'frozen lake surrounded by snowy mountains, crystalline beauty',
    'gentle snowfall in quiet forest, peaceful winter scene',
    'frost-covered branches at sunrise, delicate ice crystals',
  ],
  beach: [
    'sandy beach at dawn, pastel sky, calm sea, footprints in sand',
    'tropical beach with palm trees, turquoise water, paradise peace',
    'secluded cove with crystal clear water, golden sand, serenity',
  ],
  zen: [
    'zen garden with raked sand patterns, single cherry blossom tree',
    'japanese temple garden with koi pond, peaceful contemplation',
    'minimalist stone garden, perfect balance, meditative calm',
  ],
  generic: [
    'peaceful natural landscape, soft golden light, serene atmosphere',
    'dreamy nature scene, soft focus, calming colors, tranquil mood',
    'serene outdoor scene, gentle light, peaceful environment',
  ],
};

// Title keywords to scene theme mapping
const TITLE_THEME_MAP: Record<string, string> = {
  // Sky related
  sky: 'sky', cloud: 'sky', heaven: 'sky', air: 'sky', breeze: 'sky',
  하늘: 'sky', 구름: 'sky', 바람: 'sky',

  // Ocean related
  ocean: 'ocean', sea: 'ocean', wave: 'ocean', tide: 'ocean', marine: 'ocean',
  바다: 'ocean', 파도: 'ocean',

  // Forest related
  forest: 'forest', tree: 'forest', wood: 'forest', leaf: 'forest', bamboo: 'forest',
  숲: 'forest', 나무: 'forest', 잎: 'forest',

  // Mountain related
  mountain: 'mountain', peak: 'mountain', hill: 'mountain', valley: 'mountain', alpine: 'mountain',
  산: 'mountain', 봉우리: 'mountain', 계곡: 'mountain',

  // Water related
  river: 'water', stream: 'water', waterfall: 'water', pond: 'water', lake: 'water', rain: 'water',
  강: 'water', 호수: 'water', 폭포: 'water', 비: 'water',

  // Night related
  night: 'night', star: 'night', moon: 'night', aurora: 'night', cosmos: 'night', galaxy: 'night',
  밤: 'night', 별: 'night', 달: 'night',

  // Flower related
  flower: 'flower', blossom: 'flower', bloom: 'flower', petal: 'flower', rose: 'flower', lotus: 'flower', lavender: 'flower',
  꽃: 'flower', 벚꽃: 'flower', 연꽃: 'flower',

  // Winter related
  snow: 'winter', winter: 'winter', ice: 'winter', frost: 'winter', cold: 'winter',
  눈: 'winter', 겨울: 'winter', 얼음: 'winter',

  // Beach related
  beach: 'beach', sand: 'beach', shore: 'beach', coast: 'beach', tropical: 'beach',
  해변: 'beach', 모래: 'beach',

  // Zen related
  zen: 'zen', temple: 'zen', meditation: 'zen', peace: 'zen', calm: 'zen', still: 'zen', silent: 'zen', quiet: 'zen',
  명상: 'zen', 고요: 'zen', 평화: 'zen',
};

// Detect theme from title
function detectThemeFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase();

  // Check each keyword
  for (const [keyword, theme] of Object.entries(TITLE_THEME_MAP)) {
    if (lowerTitle.includes(keyword)) {
      return theme;
    }
  }

  return 'generic';
}

// Get scene based on title analysis
function getSceneForTitle(title: string): string {
  const theme = detectThemeFromTitle(title);
  const scenes = HEALING_SCENES[theme] || HEALING_SCENES.generic;
  return scenes[Math.floor(Math.random() * scenes.length)];
}

// Generate diverse artwork prompt based on track info
export function generateArtworkPrompt(options: {
  title: string;
  category: string;
  mood?: string;
  style?: keyof typeof ART_STYLES;
  keywords?: string;
}): string {
  // Select scene based on title keywords (not random!)
  const scene = getSceneForTitle(options.title);
  const detectedTheme = detectThemeFromTitle(options.title);

  // Build prompt - realistic photo style with title-driven scene
  const prompt = [
    HEALING_PHOTO_STYLE,
    scene,
    // Add title as reinforcement for the AI
    `capturing the essence of "${options.title}"`,
    'ultra high quality',
    'photorealistic',
    '8K resolution',
    'National Geographic style',
  ].filter(Boolean).join(', ');

  console.log(`[Imagen] Title: "${options.title}" → Theme: ${detectedTheme} → Scene: ${scene.substring(0, 50)}...`);

  return prompt;
}

// Get random art style (original - for diverse needs)
function getRandomStyle(): keyof typeof ART_STYLES {
  const popularStyles: (keyof typeof ART_STYLES)[] = [
    'watercolor', 'watercolor', 'watercolor',
    'oilPainting', 'oilPainting',
    'impressionist', 'impressionist',
    'japanese', 'korean', 'chinese',
    'digital3d', 'gradient', 'ethereal',
    'anime', 'lofi',
    'minimal', 'abstract',
  ];
  return popularStyles[Math.floor(Math.random() * popularStyles.length)];
}

// Extract meaningful theme from title
function extractThemeFromTitle(title: string): string {
  if (!title) return '';

  // Remove common generic words
  const genericWords = ['music', 'song', 'track', '음악', '노래', '힐링', 'healing'];
  let theme = title.toLowerCase();

  genericWords.forEach(word => {
    theme = theme.replace(new RegExp(word, 'gi'), '').trim();
  });

  // Return if something meaningful remains
  return theme.length > 2 ? theme : '';
}

// Generate prompt for specific art style
export function generateStyledArtworkPrompt(options: {
  title: string;
  category: string;
  mood?: string;
  artStyle: keyof typeof ART_STYLES;
  keywords?: string;
}): string {
  const category = options.category || 'healing';
  const mood = options.mood || 'calm';

  // Select random scene from category
  const scenes = CATEGORY_SCENES[category] || CATEGORY_SCENES.healing;
  const randomScene = scenes[Math.floor(Math.random() * scenes.length)];

  // Get specific style
  const styleModifier = ART_STYLES[options.artStyle];

  // Get mood atmosphere
  const atmosphere = MOOD_ATMOSPHERES[mood] || MOOD_ATMOSPHERES.calm;

  // Incorporate keywords if provided
  const keywordElements = options.keywords ? `elements of ${options.keywords}` : '';

  const prompt = [
    randomScene,
    styleModifier,
    atmosphere,
    keywordElements,
    'album cover artwork',
    'high quality',
    'masterpiece',
    '4K resolution',
  ].filter(Boolean).join(', ');

  return prompt;
}

export default ImagenClient;
