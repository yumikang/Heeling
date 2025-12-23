import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

interface AIConfig {
  music: {
    provider: string;
    apiKey: string;
    enabled: boolean;
  };
  image: {
    provider: string;
    apiKey: string;
    enabled: boolean;
  };
  text: {
    provider: string;
    apiKey: string;
    enabled: boolean;
  };
}

// Simple encryption for API keys (use proper encryption in production)
function encryptKey(key: string): string {
  if (!key) return '';
  const buffer = Buffer.from(key);
  return buffer.toString('base64');
}

function decryptKey(encrypted: string): string {
  if (!encrypted) return '';
  const buffer = Buffer.from(encrypted, 'base64');
  return buffer.toString('utf8');
}

// Mask API key for display
function maskKey(key: string): string {
  if (!key || key.length < 8) return key ? '****' : '';
  return key.substring(0, 4) + '****' + key.substring(key.length - 4);
}

// GET: Load AI settings
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          startsWith: 'ai_',
        },
      },
    });

    const config: AIConfig = {
      music: { provider: 'suno', apiKey: '', enabled: false },
      image: { provider: 'gemini', apiKey: '', enabled: false },
      text: { provider: 'openai', apiKey: '', enabled: false },
    };

    settings.forEach((setting) => {
      const value = setting.value as any;
      if (setting.key === 'ai_music') {
        config.music = {
          provider: value.provider || 'suno',
          apiKey: value.apiKey ? maskKey(decryptKey(value.apiKey)) : '',
          enabled: value.enabled || false,
        };
      } else if (setting.key === 'ai_image') {
        config.image = {
          provider: value.provider || 'gemini',
          apiKey: value.apiKey ? maskKey(decryptKey(value.apiKey)) : '',
          enabled: value.enabled || false,
        };
      } else if (setting.key === 'ai_text') {
        config.text = {
          provider: value.provider || 'openai',
          apiKey: value.apiKey ? maskKey(decryptKey(value.apiKey)) : '',
          enabled: value.enabled || false,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Load AI settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load settings' },
      { status: 500 }
    );
  }
}

// POST: Save AI settings
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: AIConfig = await request.json();

    // Get existing settings to preserve API keys if not changed
    const existingSettings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['ai_music', 'ai_image', 'ai_text'],
        },
      },
    });

    const existingMap = new Map(existingSettings.map(s => [s.key, s.value as any]));

    // Helper to get API key (use existing if masked)
    const getApiKey = (type: 'music' | 'image' | 'text', newKey: string): string => {
      if (newKey && !newKey.includes('****')) {
        return encryptKey(newKey);
      }
      const existing = existingMap.get(`ai_${type}`);
      return existing?.apiKey || '';
    };

    // Upsert settings
    await Promise.all([
      prisma.systemSetting.upsert({
        where: { key: 'ai_music' },
        update: {
          value: {
            provider: body.music.provider,
            apiKey: getApiKey('music', body.music.apiKey),
            enabled: body.music.enabled,
          },
        },
        create: {
          key: 'ai_music',
          value: {
            provider: body.music.provider,
            apiKey: getApiKey('music', body.music.apiKey),
            enabled: body.music.enabled,
          },
        },
      }),
      prisma.systemSetting.upsert({
        where: { key: 'ai_image' },
        update: {
          value: {
            provider: body.image.provider,
            apiKey: getApiKey('image', body.image.apiKey),
            enabled: body.image.enabled,
          },
        },
        create: {
          key: 'ai_image',
          value: {
            provider: body.image.provider,
            apiKey: getApiKey('image', body.image.apiKey),
            enabled: body.image.enabled,
          },
        },
      }),
      prisma.systemSetting.upsert({
        where: { key: 'ai_text' },
        update: {
          value: {
            provider: body.text.provider,
            apiKey: getApiKey('text', body.text.apiKey),
            enabled: body.text.enabled,
          },
        },
        create: {
          key: 'ai_text',
          value: {
            provider: body.text.provider,
            apiKey: getApiKey('text', body.text.apiKey),
            enabled: body.text.enabled,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error) {
    console.error('Save AI settings error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save settings' },
      { status: 500 }
    );
  }
}
