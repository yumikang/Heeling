import { NextRequest, NextResponse } from 'next/server';
import { generateETag, shouldReturn304, getETagHeaders } from '@/lib/etag';
import { prisma } from '@/lib/prisma';

// 기본 설정값 (DB에 값이 없을 때 폴백)
const DEFAULT_CONFIG = {
  // 앱 버전 관리
  version: {
    current: '1.0.0',
    minimum: '1.0.0',
    recommended: '1.0.0',
    forceUpdate: false,
    updateUrl: {
      ios: 'https://apps.apple.com/app/heeling/id000000000',
      android: 'https://play.google.com/store/apps/details?id=app.heeling',
    },
  },

  // 기능 플래그
  features: {
    enableOfflineMode: true,
    enableBackgroundPlay: true,
    enableSocialSharing: true,
    enablePushNotifications: true,
    enableAnalytics: true,
    enableCrashReporting: true,
    maxOfflineTracks: 50,
    maxPlaylistSize: 100,
  },

  // 광고 설정
  ads: {
    enabled: true,
    interstitialFrequency: 5,
    bannerEnabled: true,
    rewardedEnabled: true,
    freeTracksBeforeAd: 3,
  },

  // 구독 플랜
  subscription: {
    plans: [
      {
        id: 'premium_monthly',
        name: '프리미엄 월간',
        price: 9900,
        currency: 'KRW',
        period: 'monthly',
        features: ['광고 제거', '오프라인 재생', '고음질 스트리밍'],
      },
      {
        id: 'premium_yearly',
        name: '프리미엄 연간',
        price: 79900,
        currency: 'KRW',
        period: 'yearly',
        features: ['광고 제거', '오프라인 재생', '고음질 스트리밍', '2개월 무료'],
      },
      {
        id: 'business',
        name: '비즈니스',
        price: 29900,
        currency: 'KRW',
        period: 'monthly',
        features: ['모든 프리미엄 기능', '스케줄 재생', '다중 기기', '비즈니스 플레이리스트'],
      },
    ],
  },

  // 플레이어 설정
  player: {
    defaultVolume: 0.8,
    crossfadeDuration: 2,
    sleepTimerOptions: [15, 30, 45, 60, 90, 120],
    playbackRates: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
  },

  // 지원 정보
  support: {
    email: 'support@heeling.app',
    faqUrl: 'https://heeling.app/faq',
    termsUrl: 'https://heeling.app/terms',
    privacyUrl: 'https://heeling.app/privacy',
  },

  configVersion: 1,
};

// DB에서 설정 로드
async function loadConfigFromDB() {
  try {
    // AppConfig 테이블에서 모든 설정 가져오기
    const configs = await prisma.appConfig.findMany();

    // 카테고리 목록 가져오기
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // DB 설정을 객체로 변환
    const dbConfig: Record<string, any> = {};
    for (const config of configs) {
      try {
        dbConfig[config.key] = JSON.parse(config.value);
      } catch {
        dbConfig[config.key] = config.value;
      }
    }

    // 기본값과 DB값 병합
    const mergedConfig = {
      version: dbConfig.version || DEFAULT_CONFIG.version,
      features: dbConfig.features || DEFAULT_CONFIG.features,
      ads: dbConfig.ads || DEFAULT_CONFIG.ads,
      subscription: dbConfig.subscription || DEFAULT_CONFIG.subscription,
      categories: categories.length > 0
        ? categories.map(cat => ({
            id: cat.slug,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
          }))
        : [
            { id: 'healing', name: '힐링', icon: 'heart', color: '#EC4899' },
            { id: 'focus', name: '집중', icon: 'brain', color: '#8B5CF6' },
            { id: 'sleep', name: '수면', icon: 'moon', color: '#3B82F6' },
            { id: 'nature', name: '자연', icon: 'tree', color: '#10B981' },
            { id: 'cafe', name: '카페', icon: 'coffee', color: '#F59E0B' },
            { id: 'meditation', name: '명상', icon: 'spa', color: '#6366F1' },
          ],
      player: dbConfig.player || DEFAULT_CONFIG.player,
      support: dbConfig.support || DEFAULT_CONFIG.support,
      configVersion: dbConfig.configVersion || DEFAULT_CONFIG.configVersion,
      lastUpdated: dbConfig.lastUpdated || new Date().toISOString(),
    };

    return mergedConfig;
  } catch (error) {
    console.error('Failed to load config from DB, using defaults:', error);
    return {
      ...DEFAULT_CONFIG,
      categories: [
        { id: 'healing', name: '힐링', icon: 'heart', color: '#EC4899' },
        { id: 'focus', name: '집중', icon: 'brain', color: '#8B5CF6' },
        { id: 'sleep', name: '수면', icon: 'moon', color: '#3B82F6' },
        { id: 'nature', name: '자연', icon: 'tree', color: '#10B981' },
        { id: 'cafe', name: '카페', icon: 'coffee', color: '#F59E0B' },
        { id: 'meditation', name: '명상', icon: 'spa', color: '#6366F1' },
      ],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// ============================================
// GET /api/sync/config - 앱 설정 동기화 (ETag 지원)
// ============================================
export async function GET(request: NextRequest) {
  try {
    // DB에서 설정 로드
    const appConfig = await loadConfigFromDB();

    // ETag 생성 (설정 버전 기반)
    const etag = generateETag(`config-v${appConfig.configVersion}-${appConfig.lastUpdated}`);

    // 304 응답 체크
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (shouldReturn304(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: getETagHeaders(etag, 3600), // 1시간 캐시
      });
    }

    // 응답 데이터 구성
    const responseData = {
      success: true,
      data: appConfig,
      meta: {
        syncedAt: new Date().toISOString(),
        etag,
      },
    };

    return NextResponse.json(responseData, {
      headers: getETagHeaders(etag, 3600),
    });
  } catch (error) {
    console.error('GET /api/sync/config error:', error);
    return NextResponse.json(
      { success: false, error: '앱 설정 동기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
