import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth-edge';

// 기본 프리셋 데이터
const DEFAULT_PRESETS = [
  // 피아노 스타일
  { styleCode: 'piano', moodCode: 'calm', name: '피아노 - 평온', stylePrompt: 'Ambient, relaxing piano, soft reverb, peaceful melody, gentle dynamics, warm tone, instrumental, no vocals' },
  { styleCode: 'piano', moodCode: 'dreamy', name: '피아노 - 몽환', stylePrompt: 'Dreamy piano, ethereal atmosphere, floating melodies, soft sustain, ambient reverb, mystical, instrumental' },
  { styleCode: 'piano', moodCode: 'focus', name: '피아노 - 집중', stylePrompt: 'Minimal piano, clear notes, steady rhythm, focused ambience, clean tone, study music, instrumental' },
  { styleCode: 'piano', moodCode: 'melancholy', name: '피아노 - 서정', stylePrompt: 'Melancholic piano, emotional melody, gentle sadness, tender notes, expressive dynamics, instrumental' },
  { styleCode: 'piano', moodCode: 'uplifting', name: '피아노 - 희망', stylePrompt: 'Uplifting piano, hopeful melody, bright major key, inspiring progression, warm and positive, instrumental' },

  // 시네마 스타일
  { styleCode: 'cinema', moodCode: 'calm', name: '시네마 - 평온', stylePrompt: 'Cinematic ambient, gentle orchestral pads, film score atmosphere, peaceful soundtrack, emotional strings, instrumental' },
  { styleCode: 'cinema', moodCode: 'dreamy', name: '시네마 - 몽환', stylePrompt: 'Dreamy film score, ethereal orchestra, fantasy movie atmosphere, magical soundtrack, floating strings, cinematic wonder' },
  { styleCode: 'cinema', moodCode: 'focus', name: '시네마 - 집중', stylePrompt: 'Minimal cinematic, focused soundtrack, tension building, subtle orchestra, concentrated film music, atmospheric score' },
  { styleCode: 'cinema', moodCode: 'melancholy', name: '시네마 - 서정', stylePrompt: 'Emotional film score, melancholic orchestra, dramatic strings, tender piano, heartfelt soundtrack, cinematic sadness' },
  { styleCode: 'cinema', moodCode: 'uplifting', name: '시네마 - 희망', stylePrompt: 'Uplifting film score, inspiring orchestra, heroic themes, triumphant brass, hopeful strings, epic cinematic' },

  // 명상 스타일
  { styleCode: 'meditation', moodCode: 'calm', name: '명상 - 평온', stylePrompt: 'Meditation music, tibetan singing bowls, deep om drone, peaceful chanting, slow tempo, spiritual calm, no vocals' },
  { styleCode: 'meditation', moodCode: 'dreamy', name: '명상 - 몽환', stylePrompt: 'Transcendent meditation, ethereal drones, cosmic atmosphere, floating consciousness, deep space ambient' },
  { styleCode: 'meditation', moodCode: 'focus', name: '명상 - 집중', stylePrompt: 'Focused meditation, steady drone, mindfulness bell, clear awareness, centered breathing, concentration' },
  { styleCode: 'meditation', moodCode: 'melancholy', name: '명상 - 서정', stylePrompt: 'Contemplative meditation, gentle melancholy, inner reflection, tender awareness, emotional healing' },
  { styleCode: 'meditation', moodCode: 'uplifting', name: '명상 - 희망', stylePrompt: 'Uplifting meditation, heart chakra, loving kindness, positive affirmation atmosphere, spiritual joy' },

  // 수면 스타일
  { styleCode: 'sleep', moodCode: 'calm', name: '수면 - 평온', stylePrompt: 'Sleep music, delta waves, ultra soft dynamics, lullaby feel, dreamy drift, gentle fade, no vocals' },
  { styleCode: 'sleep', moodCode: 'dreamy', name: '수면 - 몽환', stylePrompt: 'Deep sleep, floating dreams, cosmic drift, astral ambience, ethereal lullaby, REM induction' },
  { styleCode: 'sleep', moodCode: 'focus', name: '수면 - 집중', stylePrompt: 'Sleep focus, steady white noise, consistent ambience, sleep onset, brain relaxation, no distractions' },
  { styleCode: 'sleep', moodCode: 'melancholy', name: '수면 - 서정', stylePrompt: 'Tender sleep music, gentle sadness fading, peaceful release, emotional lullaby, soothing rest' },
  { styleCode: 'sleep', moodCode: 'uplifting', name: '수면 - 희망', stylePrompt: 'Comforting sleep, warm embrace, safe dreams, peaceful hope, gentle security, nurturing rest' },

  // 집중 스타일
  { styleCode: 'focus', moodCode: 'calm', name: '집중 - 평온', stylePrompt: 'Lo-fi beats, study music, calm focus, minimal distractions, chill productivity, soft beats, no vocals' },
  { styleCode: 'focus', moodCode: 'dreamy', name: '집중 - 몽환', stylePrompt: 'Dreamy lo-fi, floating concentration, hazy focus, soft vinyl crackle, nostalgic study vibes' },
  { styleCode: 'focus', moodCode: 'focus', name: '집중 - 집중', stylePrompt: 'Deep focus music, flow state, intense concentration, minimal beats, productivity zone, no distractions' },
  { styleCode: 'focus', moodCode: 'melancholy', name: '집중 - 서정', stylePrompt: 'Melancholic lo-fi, rainy day study, emotional focus, tender beats, thoughtful concentration' },
  { styleCode: 'focus', moodCode: 'uplifting', name: '집중 - 희망', stylePrompt: 'Uplifting focus, energizing lo-fi, positive productivity, motivated study, bright concentration' },

  // 카페 스타일
  { styleCode: 'cafe', moodCode: 'calm', name: '카페 - 평온', stylePrompt: 'Cafe jazz, acoustic warmth, cozy atmosphere, soft background music, warm ambience, gentle conversation hum, instrumental' },
  { styleCode: 'cafe', moodCode: 'dreamy', name: '카페 - 몽환', stylePrompt: 'Dreamy cafe, romantic jazz, hazy afternoon, soft piano jazz, nostalgic cafe vibes, vintage warmth' },
  { styleCode: 'cafe', moodCode: 'focus', name: '카페 - 집중', stylePrompt: 'Cafe focus, steady jazz background, work-friendly ambience, coffee shop productivity, gentle rhythm' },
  { styleCode: 'cafe', moodCode: 'melancholy', name: '카페 - 서정', stylePrompt: 'Melancholic cafe, rainy window jazz, emotional warmth, nostalgic moments, tender cafe atmosphere' },
  { styleCode: 'cafe', moodCode: 'uplifting', name: '카페 - 희망', stylePrompt: 'Upbeat cafe jazz, morning coffee vibes, cheerful ambience, bright acoustic, positive energy' },

  // 클래식 스타일
  { styleCode: 'classical', moodCode: 'calm', name: '클래식 - 평온', stylePrompt: 'Classical strings, gentle orchestra, peaceful adagio, elegant calm, refined serenity, instrumental' },
  { styleCode: 'classical', moodCode: 'dreamy', name: '클래식 - 몽환', stylePrompt: 'Romantic classical, dreamy strings, impressionist atmosphere, ethereal orchestra, floating melodies' },
  { styleCode: 'classical', moodCode: 'focus', name: '클래식 - 집중', stylePrompt: 'Baroque concentration, structured classical, focused counterpoint, intellectual music, clear harmony' },
  { styleCode: 'classical', moodCode: 'melancholy', name: '클래식 - 서정', stylePrompt: 'Melancholic classical, emotional strings, romantic sadness, tender orchestra, expressive classical' },
  { styleCode: 'classical', moodCode: 'uplifting', name: '클래식 - 희망', stylePrompt: 'Triumphant classical, uplifting orchestra, heroic themes, inspiring strings, joyful symphony' },

  // 로파이 스타일
  { styleCode: 'lofi', moodCode: 'calm', name: '로파이 - 평온', stylePrompt: 'Lo-fi hip hop, chill beats, vinyl crackle, warm bass, relaxed groove, nostalgic samples, no vocals' },
  { styleCode: 'lofi', moodCode: 'dreamy', name: '로파이 - 몽환', stylePrompt: 'Dreamy lo-fi, hazy atmosphere, floating samples, nostalgic layers, soft tape wobble, ethereal chill' },
  { styleCode: 'lofi', moodCode: 'focus', name: '로파이 - 집중', stylePrompt: 'Study lo-fi, focused beats, minimal distractions, productivity chill, steady rhythm, concentration zone' },
  { styleCode: 'lofi', moodCode: 'melancholy', name: '로파이 - 서정', stylePrompt: 'Sad lo-fi, emotional beats, rainy vibes, melancholic samples, nostalgic sadness, tender chill' },
  { styleCode: 'lofi', moodCode: 'uplifting', name: '로파이 - 희망', stylePrompt: 'Upbeat lo-fi, positive chill, happy samples, bright warmth, optimistic beats, cheerful vibes' },
];

// POST: 기본 프리셋 시드 데이터 생성
export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // 기존 프리셋 확인
    const existingCount = await prisma.musicPreset.count();

    if (existingCount > 0 && !force) {
      return NextResponse.json({
        success: false,
        error: `${existingCount} presets already exist. Use ?force=true to replace all.`,
        existingCount,
      }, { status: 409 });
    }

    // force인 경우 기존 삭제
    if (force && existingCount > 0) {
      await prisma.musicPreset.deleteMany();
    }

    // 새 프리셋 생성
    const created = await prisma.musicPreset.createMany({
      data: DEFAULT_PRESETS.map(p => ({
        ...p,
        code: `${p.styleCode}_${p.moodCode}`,
        instrumentalDefault: true,
        autoEnabled: true,
        weight: 1,
      })),
    });

    return NextResponse.json({
      success: true,
      message: `Created ${created.count} presets`,
      count: created.count,
    });
  } catch (error) {
    console.error('Seed presets error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to seed presets' },
      { status: 500 }
    );
  }
}

// GET: 기본 프리셋 목록 조회 (시드 데이터 미리보기)
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    data: DEFAULT_PRESETS,
    count: DEFAULT_PRESETS.length,
  });
}
