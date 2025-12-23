export * from './colors';
export * from './typography';
export * from './spacing';
export * from './api';

// App Constants
export const APP_NAME = 'BRIBI';
export const APP_VERSION = '1.0.0';

// Feature Flags
// MVP: 온보딩(개인화 맞춤) UI 비활성화 - v1.1에서 true로 변경
export const ENABLE_ONBOARDING = false;

// Timing Constants
export const SPLASH_DURATION = 2000;
export const ANIMATION_DURATION = 300;
export const DEBOUNCE_DELAY = 300;

// Player Constants
export const MIN_BUFFER = 15;
export const MAX_BUFFER = 50;
export const VOLUME_STEP = 0.1;

// Sleep Timer Options (in minutes)
export const SLEEP_TIMER_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240] as const;

// Brightness Presets
export const BRIGHTNESS_PRESETS = {
  sleep: 0.15,        // 15% - 어두우면서도 버튼이 보이는 수준
  meditation: 0.25,   // 25% - 명상에 적합한 어두운 밝기
  relax: 0.5,
  normal: 1.0,
} as const;

// Category-based recommended brightness mapping
// Used when "auto brightness" is enabled
export const CATEGORY_BRIGHTNESS_MAP: Record<string, number> = {
  sleep: 0.15,        // 수면 - 어둡지만 조작 가능
  meditation: 0.25,   // 명상 - 어둡게
  nature: 0.5,        // 자연 - 중간
  focus: 0.7,         // 집중 - 밝게
  relax: 0.3,         // 휴식 - 약간 어둡게
  ambient: 0.4,       // 앰비언트 - 중간 어둡게
  asmr: 0.15,         // ASMR - 어둡게
  rain: 0.25,         // 비 소리 - 어둡게
  ocean: 0.35,        // 파도 소리 - 약간 어둡게
  forest: 0.45,       // 숲 소리 - 중간
  default: 0.5,       // 기본값
} as const;

// Get recommended brightness for a category
export const getRecommendedBrightness = (category?: string): number => {
  if (!category) return CATEGORY_BRIGHTNESS_MAP.default;
  return CATEGORY_BRIGHTNESS_MAP[category.toLowerCase()] ?? CATEGORY_BRIGHTNESS_MAP.default;
};

// Track Categories
export const TRACK_CATEGORIES = ['sleep', 'meditation', 'nature', 'focus'] as const;

// User Types
export const USER_TYPES = ['personal', 'business'] as const;

// Occupations
export const OCCUPATIONS = ['developer', 'designer', 'student', 'other'] as const;

// Business Types
export const BUSINESS_TYPES = ['cafe', 'spa', 'yoga', 'salon'] as const;
