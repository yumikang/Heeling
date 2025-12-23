// 타입 정의
export type TabType = 'generate' | 'tracks' | 'deployed' | 'schedule' | 'settings';

export interface Template {
  id: string;
  name: string;
  type: 'title' | 'lyrics' | 'image' | 'suno';
  content: string;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'once';
  intervalDays?: number;  // 며칠 간격 (1~30)
  runTime?: string;       // 실행 시간 (HH:mm 형식)
  count: number;          // 생성할 곡 수
  templateId: string;
  style?: string;         // 스타일 프리셋
  mood?: string;          // 무드 프리셋
  autoDeploy: boolean;    // 자동 배포 여부
  nextRun: string;
  isActive: boolean;
  lastRun?: string;
}

export interface GeneratedTrack {
  id: string;
  title: string;
  titleEn?: string;
  audioUrl: string;
  duration: number;
  imageUrl?: string;
  style?: string;
  mood?: string;
  generatedAt?: string;
  createdAt?: string;
  batchId?: string;
  taskId?: string;
  deployed?: boolean;      // 배포 여부
  deployedAt?: string;     // 배포 시간
  dbTrackId?: string;      // DB Track ID (배포 후 연결)
}

// 배포된 트랙 (DB에서 조회)
export interface DeployedTrack {
  id: string;
  title: string;
  artist: string;
  fileUrl: string;
  thumbnailUrl?: string;
  duration: number;
  category: string;
  mood?: string;
  tags: string[];
  playCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GenerationProgress {
  currentBatch: number;
  totalBatches: number;
  currentTrack: number;
  totalTracks: number;
  phase: 'title' | 'music' | 'waiting' | 'downloading' | 'image' | 'complete' | 'error';
  currentTitle?: string;
  currentTitleEn?: string;
  taskIds: string[];
  completedTracks: GeneratedTrack[];
  errorMessage?: string;
}

export interface APIConfig {
  music: { provider: string; apiKey: string; enabled: boolean };
  image: { provider: string; apiKey: string; enabled: boolean };
  text: { provider: string; apiKey: string; enabled: boolean };
}

export interface TitleCacheStatus {
  available: number;
  total: number;
  needsGeneration: boolean;
  loading: boolean;
  generating: boolean;
}

export interface SyncProgress {
  current: number;
  total: number;
  status: string;
}
