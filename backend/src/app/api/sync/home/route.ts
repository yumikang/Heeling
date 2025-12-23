import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateETagFromDates, shouldReturn304, getETagHeaders } from '@/lib/etag';

// ============================================
// GET /api/sync/home - 홈 섹션 설정 동기화 (ETag 지원)
// ============================================
export async function GET(request: NextRequest) {
  try {
    // 활성화된 홈 섹션 조회 (아이템 포함)
    const sections = await prisma.homeSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        type: true,
        title: true,
        subtitle: true,
        sortOrder: true,
        showMoreButton: true,
        moreButtonTarget: true,
        config: true,
        updatedAt: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            itemType: true,
            itemId: true,
            sortOrder: true,
            config: true,
            createdAt: true,
          },
        },
      },
    });

    // ETag 생성 (섹션들의 최신 업데이트 시간 기반)
    const sectionDates = sections.map(s => s.updatedAt);
    const etag = generateETagFromDates(sectionDates);

    // 304 응답 체크
    const ifNoneMatch = request.headers.get('If-None-Match');
    if (shouldReturn304(ifNoneMatch, etag)) {
      return new NextResponse(null, {
        status: 304,
        headers: getETagHeaders(etag, 60), // 1분 캐시 (홈 화면은 자주 변경될 수 있음)
      });
    }

    // 각 섹션 타입에 따라 필요한 추가 데이터 로드
    const enrichedSections = await Promise.all(
      sections.map(async (section) => {
        // 타입을 소문자로 변환 (앱과 호환성)
        const sectionType = section.type.toLowerCase();
        const enrichedSection: any = {
          ...section,
          type: sectionType,
        };

        // 트랙 관련 섹션의 경우 아이템 ID로 트랙 정보 조회
        if (['track_carousel', 'track_list', 'featured_track'].includes(sectionType)) {
          const trackIds = section.items
            .filter(item => item.itemType === 'track' && item.itemId)
            .map(item => item.itemId as string);

          if (trackIds.length > 0) {
            const tracks = await prisma.track.findMany({
              where: {
                id: { in: trackIds },
                isActive: true,
              },
              select: {
                id: true,
                title: true,
                artist: true,
                fileUrl: true,
                thumbnailUrl: true,
                duration: true,
                category: true,
              },
            });

            // 트랙 정보를 아이템에 매핑
            enrichedSection.items = section.items.map(item => ({
              ...item,
              trackData: item.itemType === 'track'
                ? tracks.find(t => t.id === item.itemId) || null
                : null,
            }));
          }
        }

        // RECENTLY_PLAYED는 사용자별 데이터이므로 여기서는 설정만 반환
        // 실제 재생 기록은 클라이언트에서 userId로 별도 조회

        return enrichedSection;
      })
    );

    // 응답 데이터 구성
    const responseData = {
      success: true,
      data: {
        sections: enrichedSections,
        totalCount: enrichedSections.length,
      },
      meta: {
        syncedAt: new Date().toISOString(),
        etag,
      },
    };

    return NextResponse.json(responseData, {
      headers: getETagHeaders(etag, 60),
    });
  } catch (error) {
    console.error('GET /api/sync/home error:', error);
    return NextResponse.json(
      { success: false, error: '홈 섹션 동기화에 실패했습니다.' },
      { status: 500 }
    );
  }
}
