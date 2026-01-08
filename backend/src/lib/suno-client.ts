/**
 * Suno API Client
 * Music generation using Suno AI
 */

const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';

export interface SunoGenerateParams {
  prompt: string;           // 가사 또는 설명
  style?: string;           // 장르/스타일 (최대 200자)
  title?: string;           // 트랙 제목 (최대 80자)
  instrumental?: boolean;   // 악기만 (보컬 없음)
  model?: 'V5' | 'V4_5PLUS' | 'V4_5' | 'V4';  // API v1 모델명
  vocalGender?: 'f' | 'm'; // 보컬 성별 (v4.5+)
  callBackUrl?: string;     // 콜백 URL (필수 - 유효한 URI 형식)
}

// Default callback URL - use environment variable or placeholder
const DEFAULT_CALLBACK_URL = process.env.SUNO_CALLBACK_URL || 'https://example.com/api/callback';

export interface SunoTrack {
  id: string;
  audio_url: string;
  title: string;
  tags: string;
  duration: number;
  image_url?: string;
  // V5 model response uses camelCase
  audioUrl?: string;
  streamAudioUrl?: string;
  imageUrl?: string;
}

export interface SunoResponse {
  code: number;
  msg: string;
  data: {
    taskId?: string;
    status?: 'SUCCESS' | 'TEXT_SUCCESS' | 'PENDING' | 'RUNNING' | 'FAILED';
    response?: {
      data?: SunoTrack[];
      sunoData?: SunoTrack[];  // Actual API format
    };
    data?: SunoTrack[];  // Fallback format
  };
}

export class SunoClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate music from prompt
   * API docs: https://docs.sunoapi.org/suno-api/generate-music
   */
  async generateMusic(params: SunoGenerateParams): Promise<SunoResponse> {
    const requestBody = {
      customMode: !!params.style,
      prompt: params.prompt,
      style: params.style || 'Ambient, Relaxing, Piano',
      title: params.title || 'Generated Track',
      instrumental: params.instrumental ?? true,
      model: params.model || 'V5',  // V5, V4_5PLUS, V4_5, V4
      callBackUrl: params.callBackUrl || DEFAULT_CALLBACK_URL,  // Required - must be valid URI
      ...(params.vocalGender && { vocalGender: params.vocalGender }),
    };

    console.log('[Suno API] Request:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${SUNO_API_BASE}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('[Suno API] Response status:', response.status);
    console.log('[Suno API] Response body:', responseText);

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status} - ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(`Suno API invalid response: ${responseText}`);
    }
  }

  /**
   * Get task status and result
   */
  async getStatus(taskId: string): Promise<SunoResponse> {
    console.log('[Suno Client] Getting status for taskId:', taskId);

    const response = await fetch(
      `${SUNO_API_BASE}/generate/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    const responseText = await response.text();
    console.log('[Suno Client] Status response status:', response.status);
    console.log('[Suno Client] Status response body:', responseText);

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status} - ${responseText}`);
    }

    try {
      return JSON.parse(responseText);
    } catch {
      throw new Error(`Suno API invalid status response: ${responseText}`);
    }
  }

  /**
   * Poll until generation is complete
   */
  async pollUntilReady(
    taskId: string,
    maxAttempts = 60,
    intervalMs = 5000
  ): Promise<SunoTrack[]> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getStatus(taskId);

      if (result.data?.status === 'SUCCESS' && result.data?.response?.data) {
        return result.data.response.data;
      }

      if (result.data?.status === 'FAILED') {
        throw new Error('Music generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error('Music generation timeout');
  }

  /**
   * Check remaining credits
   * Response format: { code: 200, msg: "success", data: 100 }
   * where data is the number of credits available
   */
  async getCredits(): Promise<{ credits: number }> {
    const response = await fetch(`${SUNO_API_BASE}/generate/credit`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`);
    }

    const result = await response.json();
    // data is directly the credit number, not an object
    const credits = typeof result.data === 'number' ? result.data : (result.data?.credit || 0);
    return { credits };
  }

  /**
   * Get generation records/history
   * Returns list of previously generated tracks
   */
  async getRecords(page = 1, limit = 20): Promise<{
    total: number;
    records: Array<{
      taskId: string;
      status: string;
      createdAt: string;
      tracks: SunoTrack[];
    }>;
  }> {
    const response = await fetch(
      `${SUNO_API_BASE}/generate/record-info?page=${page}&pageSize=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('[Suno API] getRecords error:', response.status, text);
      throw new Error(`Suno API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[Suno API] getRecords response:', JSON.stringify(result, null, 2));

    // Parse response - structure varies by API version
    const records = result.data?.list || result.data?.records || [];
    const total = result.data?.total || records.length;

    return {
      total,
      records: records.map((record: any) => ({
        taskId: record.taskId || record.id,
        status: record.status,
        createdAt: record.createdAt || record.created_at,
        tracks: (record.response?.sunoData || record.response?.data || record.data || []).map((t: any) => ({
          id: t.id,
          title: t.title,
          audio_url: t.streamAudioUrl || t.audioUrl || t.audio_url || '',
          image_url: t.imageUrl || t.image_url || '',
          duration: t.duration,
          tags: t.tags,
        })),
      })),
    };
  }

  /**
   * Generate lyrics only
   */
  async generateLyrics(prompt: string): Promise<string> {
    const response = await fetch(`${SUNO_API_BASE}/lyrics`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.lyrics || '';
  }
}

// Duration hint for consistent track length
const DURATION_HINT = ', 3-4 minutes long, extended composition';

// Predefined styles for healing music
export const HEALING_STYLES = {
  piano: 'Ambient, Relaxing, Piano, Soft, Peaceful' + DURATION_HINT,
  nature: 'Nature Sounds, Ambient, Birds, Water, Forest' + DURATION_HINT,
  meditation: 'Meditation, Tibetan Singing Bowls, Om, Drone, Peaceful' + DURATION_HINT,
  sleep: 'Sleep Music, Delta Waves, Soft, Dreamy, Ambient' + DURATION_HINT,
  focus: 'Lo-fi, Study, Chill, Minimal, Beats' + DURATION_HINT,
  cafe: 'Cafe Jazz, Acoustic, Warm, Cozy, Background' + DURATION_HINT,
  classical: 'Classical, Orchestra, Strings, Emotional, Cinematic' + DURATION_HINT,
  lofi: 'Lo-fi Hip Hop, Chill, Relaxed, Vinyl, Nostalgic' + DURATION_HINT,
};

// Generate prompt based on mood and style
export function generateSunoPrompt(options: {
  mood: string;
  style: keyof typeof HEALING_STYLES;
  description?: string;
}): { prompt: string; style: string } {
  const baseStyle = HEALING_STYLES[options.style] || HEALING_STYLES.piano;

  const moodDescriptions: Record<string, string> = {
    calm: 'Create a calming and peaceful atmosphere',
    energetic: 'Uplifting yet gentle energy',
    dreamy: 'Ethereal and dreamlike soundscape',
    focus: 'Clear and focused ambient sound',
    melancholy: 'Gentle, slightly melancholic beauty',
  };

  const prompt = options.description || moodDescriptions[options.mood] || 'Peaceful healing music';

  return {
    prompt,
    style: baseStyle,
  };
}

export default SunoClient;
