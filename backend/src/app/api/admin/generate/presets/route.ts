import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

// GET: 모든 프리셋 조회
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const styleCode = searchParams.get('styleCode');
    const moodCode = searchParams.get('moodCode');
    const autoEnabledOnly = searchParams.get('autoEnabled') === 'true';

    const where: any = {};
    if (styleCode) where.styleCode = styleCode;
    if (moodCode) where.moodCode = moodCode;
    if (autoEnabledOnly) where.autoEnabled = true;

    const presets = await prisma.musicPreset.findMany({
      where,
      orderBy: [{ styleCode: 'asc' }, { moodCode: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: presets,
    });
  } catch (error) {
    console.error('Get presets error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch presets' },
      { status: 500 }
    );
  }
}

// POST: 새 프리셋 생성
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      styleCode,
      moodCode,
      name,
      stylePrompt,
      instrumentalDefault = true,
      autoEnabled = true,
      weight = 1,
    } = body;

    if (!styleCode || !moodCode || !name || !stylePrompt) {
      return NextResponse.json(
        { success: false, error: 'styleCode, moodCode, name, stylePrompt are required' },
        { status: 400 }
      );
    }

    // 자동 코드 생성
    const code = `${styleCode}_${moodCode}`;

    // 중복 체크
    const existing = await prisma.musicPreset.findFirst({
      where: { OR: [{ code }, { styleCode, moodCode }] },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Preset with this style/mood combination already exists' },
        { status: 409 }
      );
    }

    const preset = await prisma.musicPreset.create({
      data: {
        styleCode,
        moodCode,
        code,
        name,
        stylePrompt,
        instrumentalDefault,
        autoEnabled,
        weight,
      },
    });

    return NextResponse.json({
      success: true,
      data: preset,
    });
  } catch (error) {
    console.error('Create preset error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create preset' },
      { status: 500 }
    );
  }
}

// PUT: 프리셋 수정
export async function PUT(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, stylePrompt, instrumentalDefault, autoEnabled, weight } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (stylePrompt !== undefined) updateData.stylePrompt = stylePrompt;
    if (instrumentalDefault !== undefined) updateData.instrumentalDefault = instrumentalDefault;
    if (autoEnabled !== undefined) updateData.autoEnabled = autoEnabled;
    if (weight !== undefined) updateData.weight = weight;

    const preset = await prisma.musicPreset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: preset,
    });
  } catch (error) {
    console.error('Update preset error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to update preset' },
      { status: 500 }
    );
  }
}

// DELETE: 프리셋 삭제
export async function DELETE(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    await prisma.musicPreset.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Preset deleted successfully',
    });
  } catch (error) {
    console.error('Delete preset error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete preset' },
      { status: 500 }
    );
  }
}
