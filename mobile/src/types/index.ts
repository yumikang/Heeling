// Track Types
export interface Track {
  id: string;
  title: string;
  artist: string;
  category: string; // sleep, meditation, nature, focus, healing, etc.
  duration: number;
  audioFile: string;
  backgroundImage: string;
  recommendedBrightness: number;
  isFree: boolean;
  sortOrder: number;
  createdAt: string;
  tags?: string[];
  playCount?: number;
}

// User Types
export interface User {
  id: string;
  provider: 'apple' | 'google' | 'guest';
  email?: string;
  displayName?: string;
  isPremium?: boolean; // 프리미엄 구독 여부
  premiumExpiresAt?: string; // 프리미엄 만료일
  createdAt: string;
  lastLogin: string;
}

export type UserType = 'personal' | 'business';
export type Occupation = 'developer' | 'designer' | 'student' | 'other';
export type BusinessType = 'cafe' | 'spa' | 'yoga' | 'salon';

// User Settings
export interface UserSettings {
  userId: string;
  defaultBrightness: number;
  clockStyle: 'digital' | 'analog' | 'minimal';
  clockPersist: boolean;
  hapticEnabled: boolean;
  autoPlay: boolean;
  crossFade: boolean;
  defaultVolume: number;
  defaultSleepTimer: number | null;
  createdAt: string;
  updatedAt: string;
}

// Play History
export interface PlayHistory {
  id: string;
  userId: string;
  trackId: string;
  playedAt: string;
  durationPlayed: number;
}

// Favorite
export interface Favorite {
  id: string;
  userId: string;
  trackId: string;
  createdAt: string;
}

// Player Types
export type PlaybackState = 'playing' | 'paused' | 'stopped' | 'buffering' | 'loading';

export interface PlayerProgress {
  position: number;
  duration: number;
  buffered: number;
}

export type SleepTimerOption = 15 | 30 | 45 | 60 | 90 | 120 | 180 | 240 | null;

// Network Types
export type NetworkMode = 'wifi_only' | 'streaming' | 'offline';
export type StreamingQuality = 'auto' | 'high' | 'low';
export type NetworkStatus = 'wifi' | 'cellular' | 'none';

export interface NetworkSettings {
  networkMode: NetworkMode;
  streamingQuality: StreamingQuality;
  allowCellularDownload: boolean;
}

// Push Notification Settings
export interface NotificationSettings {
  pushEnabled: boolean;
  marketingEnabled: boolean;
  reminderEnabled: boolean;
  nightModeEnabled: boolean; // 야간 방해 금지
  nightModeStart: string; // "22:00"
  nightModeEnd: string; // "07:00"
}

// Popup/Modal Types (백엔드 API 응답용)
export type PopupType = 'fullscreen' | 'modal';
export type PopupActionType = 'link' | 'screen' | 'dismiss' | 'deeplink';

export interface PopupButton {
  id: string;
  label: string;
  action: PopupActionType;
  value?: string; // URL, screen name, or deeplink
  style?: 'primary' | 'secondary' | 'text';
}

export interface PopupData {
  id: string;
  type: PopupType;
  title?: string;
  message?: string;
  imageUrl?: string;
  backgroundColor?: string;
  buttons: PopupButton[];
  // 표시 조건
  showOnce: boolean; // 한 번만 표시
  startDate?: string; // ISO date
  endDate?: string; // ISO date
  targetUserTypes?: UserType[]; // 특정 사용자 타입에만 표시
  excludePremium?: boolean; // 프리미엄 사용자 제외
  requiresPremium?: boolean; // 프리미엄 사용자에게만 표시
  priority: number; // 높을수록 우선 표시
  dismissible: boolean; // 바깥 클릭으로 닫기 가능 여부
  showDontShowAgain?: boolean; // "다시 보지 않기" 버튼 표시 여부
  // 전체화면 전용 옵션
  fullscreenOptions?: {
    showCloseButton: boolean;
    closeButtonDelay?: number; // 몇 초 후 닫기 버튼 표시
    autoCloseDelay?: number; // 자동 닫힘 (초)
  };
}

export interface PopupResponse {
  popups: PopupData[];
  lastUpdated: string;
}

// Content Page Types
export type PageType = 'NOTICE' | 'EVENT' | 'POLICY' | 'FAQ' | 'GUIDE';

export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  type: PageType;
  publishedAt: string | null;
  updatedAt: string;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Login: { fromSettings?: boolean } | undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  Player: { trackId: string };
  Playlist: { playlistId: string };
  Premium: undefined;
  Search: undefined;
  ContentPage: { slug: string; title?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Library: { category?: string } | undefined;
  Favorites: undefined;
  Settings: undefined;
};
