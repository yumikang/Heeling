import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

// GET: 음악 프리셋 목록 조회
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const presets = await prisma.musicPreset.findMany({
      orderBy: [
        { styleCode: 'asc' },
        { moodCode: 'asc' },
      ],
      select: {
        id: true,
        styleCode: true,
        moodCode: true,
        code: true,
        name: true,
        stylePrompt: true,
        autoEnabled: true,
      },
    });

    // UI 호환성을 위해 필드명 매핑
    const mappedPresets = presets.map(p => ({
      id: p.id,
      styleCode: p.styleCode,
      styleName: p.name.split(' - ')[0] || p.styleCode,
      moodCode: p.moodCode,
      moodName: p.name.split(' - ')[1] || p.moodCode,
      code: p.code,
      name: p.name,
      promptTemplate: p.stylePrompt,
      isActive: p.autoEnabled,
    }));

    return NextResponse.json({
      success: true,
      data: mappedPresets,
    });
  } catch (error) {
    console.error('[Presets API] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}
