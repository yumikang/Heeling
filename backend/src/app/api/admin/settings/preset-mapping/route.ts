import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

const SETTING_KEY = 'preset_playlist_mapping';

// GET: 프리셋-플레이리스트 매핑 조회
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting || !setting.value) {
      // 기본값 반환
      return NextResponse.json({
        success: true,
        data: {
          styleToPlaylists: {},
          moodToPlaylists: {},
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: setting.value,
    });
  } catch (error) {
    console.error('[Preset Mapping API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preset mapping' },
      { status: 500 }
    );
  }
}

// PUT: 프리셋-플레이리스트 매핑 저장
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { styleToPlaylists, moodToPlaylists } = body;

    if (!styleToPlaylists || !moodToPlaylists) {
      return NextResponse.json(
        { success: false, error: 'styleToPlaylists and moodToPlaylists are required' },
        { status: 400 }
      );
    }

    const mappingConfig = {
      styleToPlaylists,
      moodToPlaylists,
    };

    await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: { value: mappingConfig as any },
      create: { key: SETTING_KEY, value: mappingConfig as any },
    });

    return NextResponse.json({
      success: true,
      message: 'Preset mapping saved successfully',
    });
  } catch (error) {
    console.error('[Preset Mapping API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save preset mapping' },
      { status: 500 }
    );
  }
}
