import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ==========================================
  // 어드민 계정 생성 (최우선)
  // ==========================================
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@heeling.app'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin1234'

  const existingAdmin = await prisma.admin.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
      },
    })

    console.log(`✅ Admin account created: ${adminEmail}`)
    console.log(`   Password: ${adminPassword}`)
    console.log('   ⚠️  Please change this password after first login!')
  } else {
    console.log(`ℹ️  Admin account already exists: ${adminEmail}`)
  }

  // 기존 데이터 삭제 (개발용)
  await prisma.playlistTrack.deleteMany()
  await prisma.playHistory.deleteMany()
  await prisma.favorite.deleteMany()
  await prisma.adImpression.deleteMany()
  await prisma.businessSchedule.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.playlist.deleteMany()
  await prisma.track.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // ==========================================
  // 샘플 트랙 생성 (6개)
  // ==========================================
  const sampleTracks = [
    {
      title: 'Dreaming in Dusk',
      artist: 'Heeling',
      composer: 'Heeling Studio',
      createdWith: 'Suno AI',
      fileUrl: '/audio/Dreaming in Dusk.mp3',
      thumbnailUrl: '',
      duration: 221,
      category: 'sleep',
      tags: ['수면', '황혼', '몽환'],
      mood: 'dreamy',
      playCount: 3120,
      likeCount: 234,
    },
    {
      title: 'Dreams in Slow Motion',
      artist: 'Heeling',
      composer: 'Heeling Studio',
      createdWith: 'Suno AI',
      fileUrl: '/audio/Dreams in Slow Motion.mp3',
      thumbnailUrl: '',
      duration: 152,
      category: 'healing',
      tags: ['힐링', '느림', '평화'],
      mood: 'calm',
      playCount: 1250,
      likeCount: 89,
    },
    {
      title: 'Moonlight Murmur',
      artist: 'Heeling',
      composer: 'Heeling Studio',
      createdWith: 'Suno AI',
      fileUrl: '/audio/Moonlight Murmur.mp3',
      thumbnailUrl: '',
      duration: 158,
      category: 'meditation',
      tags: ['명상', '달빛', '속삭임'],
      mood: 'calm',
      playCount: 2100,
      likeCount: 189,
    },
    {
      title: 'Moonlight Reverie',
      artist: 'Heeling',
      composer: 'Heeling Studio',
      createdWith: 'Suno AI',
      fileUrl: '/audio/Moonlight Reverie.mp3',
      thumbnailUrl: '',
      duration: 176,
      category: 'focus',
      tags: ['집중', '달빛', '몽상'],
      mood: 'focus',
      playCount: 2340,
      likeCount: 156,
    },
    {
      title: 'Pink Cloud',
      artist: 'Heeling',
      composer: 'Heeling Studio',
      createdWith: 'Suno AI',
      fileUrl: '/audio/Pink cloud.mp3',
      thumbnailUrl: '',
      duration: 152,
      category: 'cafe',
      tags: ['카페', '구름', '분홍'],
      mood: 'energetic',
      playCount: 1560,
      likeCount: 112,
    },
    {
      title: 'Still as the Sky',
      artist: 'Heeling',
      composer: 'Heeling Studio',
      createdWith: 'Suno AI',
      fileUrl: '/audio/Still as the Sky.mp3',
      thumbnailUrl: '',
      duration: 153,
      category: 'nature',
      tags: ['자연', '하늘', '고요'],
      mood: 'calm',
      playCount: 890,
      likeCount: 67,
    },
  ]

  const createdTracks = []
  for (let i = 0; i < sampleTracks.length; i++) {
    const track = await prisma.track.create({
      data: {
        ...sampleTracks[i],
        sortOrder: i,
        isActive: true,
      },
    })
    createdTracks.push(track)
  }

  console.log('✅ Created 6 sample tracks')

  // ==========================================
  // 플레이리스트 생성
  // ==========================================
  const focusPlaylist = await prisma.playlist.create({
    data: {
      name: '집중 모드',
      description: '업무와 공부에 최적화된 집중력 향상 음악',
      type: 'THEME',
      theme: 'focus',
      isFeatured: true,
      isPublic: true,
    },
  })

  const sleepPlaylist = await prisma.playlist.create({
    data: {
      name: '깊은 수면',
      description: '편안한 밤을 위한 수면 유도 음악',
      type: 'THEME',
      theme: 'sleep',
      timeSlot: 'NIGHT',
      isFeatured: true,
      isPublic: true,
    },
  })

  const cafePlaylist = await prisma.playlist.create({
    data: {
      name: '카페 분위기',
      description: '아늑한 카페 분위기를 위한 BGM',
      type: 'BUSINESS_TEMPLATE',
      theme: 'cafe',
      targetUserType: 'BUSINESS',
      targetBusiness: 'cafe',
      isFeatured: true,
      isPublic: true,
    },
  })

  const morningPlaylist = await prisma.playlist.create({
    data: {
      name: '상쾌한 아침',
      description: '활기찬 하루의 시작을 위한 음악',
      type: 'THEME',
      theme: 'morning',
      timeSlot: 'MORNING',
      isFeatured: true,
      isPublic: true,
    },
  })

  const yogaPlaylist = await prisma.playlist.create({
    data: {
      name: '요가 & 명상',
      description: '마음챙김과 명상을 위한 평화로운 음악',
      type: 'BUSINESS_TEMPLATE',
      theme: 'meditation',
      targetUserType: 'BUSINESS',
      targetBusiness: 'yoga',
      isPublic: true,
    },
  })

  // 플레이리스트에 트랙 연결
  const playlistTrackMappings = [
    { playlistId: focusPlaylist.id, trackIds: [createdTracks[1].id, createdTracks[0].id] }, // 집중 모드: 로파이, 아침
    { playlistId: sleepPlaylist.id, trackIds: [createdTracks[2].id, createdTracks[5].id] }, // 깊은 수면: 수면, 명상
    { playlistId: cafePlaylist.id, trackIds: [createdTracks[4].id, createdTracks[1].id] }, // 카페: 재즈, 로파이
    { playlistId: morningPlaylist.id, trackIds: [createdTracks[0].id, createdTracks[3].id] }, // 아침: 아침, 새소리
    { playlistId: yogaPlaylist.id, trackIds: [createdTracks[5].id, createdTracks[0].id] }, // 요가: 명상, 아침
  ]

  for (const mapping of playlistTrackMappings) {
    for (let i = 0; i < mapping.trackIds.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: mapping.playlistId,
          trackId: mapping.trackIds[i],
          position: i,
        },
      })
    }
  }

  console.log('✅ Created 5 playlists with tracks')

  // ==========================================
  // 테스트 사용자 생성
  // ==========================================
  await prisma.user.create({
    data: {
      email: 'test@heeling.app',
      name: '테스트 유저',
      userType: 'PERSONAL',
      occupation: 'developer',
      preferredThemes: ['focus', 'sleep'],
      subscriptionTier: 'FREE',
      onboardingCompleted: true,
    },
  })

  await prisma.user.create({
    data: {
      email: 'cafe@heeling.app',
      name: '카페 테스트',
      userType: 'BUSINESS',
      businessType: 'cafe',
      preferredThemes: ['cafe', 'morning'],
      subscriptionTier: 'FREE',
      onboardingCompleted: true,
    },
  })

  console.log('✅ Created 2 test users')

  // ==========================================
  // 카테고리 생성
  // ==========================================
  await prisma.category.deleteMany()

  const categories = [
    { slug: 'healing', name: '힐링', description: '마음을 편안하게 해주는 음악', icon: 'heart', color: '#EC4899' },
    { slug: 'focus', name: '집중', description: '업무와 공부에 집중할 수 있는 음악', icon: 'brain', color: '#8B5CF6' },
    { slug: 'sleep', name: '수면', description: '편안한 잠을 위한 음악', icon: 'moon', color: '#3B82F6' },
    { slug: 'nature', name: '자연', description: '자연의 소리와 함께하는 음악', icon: 'tree', color: '#10B981' },
    { slug: 'cafe', name: '카페', description: '아늑한 카페 분위기의 음악', icon: 'coffee', color: '#F59E0B' },
    { slug: 'meditation', name: '명상', description: '마음챙김을 위한 명상 음악', icon: 'spa', color: '#6366F1' },
  ]

  for (let i = 0; i < categories.length; i++) {
    await prisma.category.create({
      data: {
        ...categories[i],
        sortOrder: i,
        isActive: true,
      },
    })
  }

  console.log('✅ Created 6 categories')

  // ==========================================
  // 배너 생성
  // ==========================================
  await prisma.banner.deleteMany()

  const banners = [
    {
      type: 'HERO' as const,
      title: '마음이 편안해지는 순간',
      subtitle: 'Heeling과 함께 일상의 스트레스를 날려보세요',
      imageUrl: '/images/banners/hero-1.jpg',
      linkType: 'screen',
      linkTarget: 'PlayerScreen',
      sortOrder: 0,
    },
    {
      type: 'HERO' as const,
      title: '집중력을 높여주는 음악',
      subtitle: '업무 효율을 200% 높여보세요',
      imageUrl: '/images/banners/hero-2.jpg',
      linkType: 'deeplink',
      linkTarget: 'heeling://playlists/focus',
      sortOrder: 1,
    },
    {
      type: 'PROMOTION' as const,
      title: '프리미엄 무료 체험',
      subtitle: '7일 무료 체험 시작하기',
      imageUrl: '/images/banners/promo-1.jpg',
      linkType: 'screen',
      linkTarget: 'SubscriptionScreen',
      sortOrder: 0,
    },
    {
      type: 'EVENT' as const,
      title: '신규 트랙 업데이트',
      subtitle: '이번 주 새로운 힐링 음악 10곡 추가',
      imageUrl: '/images/banners/event-1.jpg',
      linkType: 'screen',
      linkTarget: 'NewTracksScreen',
      sortOrder: 0,
    },
  ]

  for (const banner of banners) {
    await prisma.banner.create({
      data: {
        ...banner,
        isActive: true,
      },
    })
  }

  console.log('✅ Created 4 banners')

  // ==========================================
  // 팝업 생성
  // ==========================================
  await prisma.popup.deleteMany()

  const popups = [
    {
      type: 'POPUP' as const,
      title: '앱 업데이트 안내',
      content: '더 나은 서비스를 위해 앱이 업데이트되었습니다. 새로운 기능을 확인해보세요!',
      imageUrl: '/images/popups/update.jpg',
      linkType: 'url',
      linkTarget: 'https://heeling.app/updates',
      priority: 10,
      showOnce: true,
      isActive: true,
    },
    {
      type: 'NOTICE' as const,
      title: '서비스 이용약관 변경 안내',
      content: '2025년 1월 1일부터 적용되는 새로운 이용약관을 확인해주세요.',
      linkType: 'url',
      linkTarget: 'https://heeling.app/terms',
      priority: 5,
      showOnce: false,
      isActive: false,
    },
    {
      type: 'EVENT' as const,
      title: '🎉 신규 가입 이벤트',
      content: '지금 가입하면 프리미엄 7일 무료!',
      imageUrl: '/images/popups/event.jpg',
      linkType: 'screen',
      linkTarget: 'SubscriptionScreen',
      targetUserType: 'PERSONAL' as const,
      priority: 8,
      showOnce: true,
      isActive: true,
    },
  ]

  for (const popup of popups) {
    await prisma.popup.create({
      data: popup,
    })
  }

  console.log('✅ Created 3 popups')

  // ==========================================
  // 홈 섹션 생성
  // ==========================================
  await prisma.homeSectionItem.deleteMany()
  await prisma.homeSection.deleteMany()

  const homeSections = [
    {
      type: 'HERO_BANNER' as const,
      title: null,
      subtitle: null,
      sortOrder: 0,
      isVisible: true,
      showMoreButton: false,
    },
    {
      type: 'ICON_MENU' as const,
      title: '카테고리',
      subtitle: null,
      sortOrder: 1,
      isVisible: true,
      showMoreButton: false,
    },
    {
      type: 'TRACK_CAROUSEL' as const,
      title: '추천 트랙',
      subtitle: '지금 인기있는 힐링 음악',
      sortOrder: 2,
      isVisible: true,
      showMoreButton: true,
      moreButtonTarget: 'AllTracksScreen',
    },
    {
      type: 'BANNER' as const,
      title: null,
      subtitle: null,
      sortOrder: 3,
      isVisible: true,
      showMoreButton: false,
    },
    {
      type: 'RECENTLY_PLAYED' as const,
      title: '최근 재생',
      subtitle: null,
      sortOrder: 4,
      isVisible: true,
      showMoreButton: true,
      moreButtonTarget: 'HistoryScreen',
    },
  ]

  // 섹션 생성 및 ID 저장
  const createdSections: Record<string, string> = {}
  for (const section of homeSections) {
    const created = await prisma.homeSection.create({
      data: section,
    })
    createdSections[section.type] = created.id
  }

  console.log('✅ Created 5 home sections')

  // ==========================================
  // 홈 섹션 아이템 생성 (트랙 연결)
  // ==========================================
  await prisma.homeSectionItem.deleteMany()

  // TRACK_CAROUSEL 섹션에 트랙 연결
  const trackCarouselSectionId = createdSections['TRACK_CAROUSEL']
  if (trackCarouselSectionId) {
    const allTracks = await prisma.track.findMany({
      take: 10,
      orderBy: { sortOrder: 'asc' },
    })

    for (let i = 0; i < allTracks.length; i++) {
      await prisma.homeSectionItem.create({
        data: {
          sectionId: trackCarouselSectionId,
          itemType: 'track',
          itemId: allTracks[i].id,
          sortOrder: i,
        },
      })
    }
    console.log(`✅ Added ${allTracks.length} tracks to TRACK_CAROUSEL section`)
  }

  // ==========================================
  // 샘플 팝업 생성
  // ==========================================
  await prisma.popup.deleteMany()

  const now = new Date()
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const samplePopups = [
    {
      type: 'POPUP' as const,
      title: '🎉 신규 가입 이벤트',
      content: '지금 가입하시면 7일 무료 프리미엄 체험권을 드립니다!',
      imageUrl: null,
      linkType: 'navigate',
      linkTarget: 'Premium',
      targetUserType: 'PERSONAL' as const,
      priority: 10,
      showOnce: false,
      isActive: true,
      startDate: now,
      endDate: nextMonth,
    },
    {
      type: 'EVENT' as const,
      title: '새로운 힐링 음악이 추가되었어요',
      content: '이번 주 새로 추가된 힐링 음악을 들어보세요. 깊은 수면과 집중에 도움이 됩니다.',
      imageUrl: null,
      linkType: 'navigate',
      linkTarget: 'Library',
      targetUserType: null,
      priority: 5,
      showOnce: true,
      isActive: true,
      startDate: now,
      endDate: nextMonth,
    },
  ]

  for (const popup of samplePopups) {
    await prisma.popup.create({
      data: popup,
    })
  }

  console.log('✅ Created 2 sample popups')

  // ==========================================
  // 샘플 페이지 생성
  // ==========================================
  await prisma.page.deleteMany()

  const samplePages = [
    {
      slug: 'terms-of-service',
      title: '서비스 이용약관',
      content: `<h2>제 1 조 (목적)</h2>
<p>이 약관은 Heeling(이하 "회사")이 제공하는 음악 스트리밍 서비스(이하 "서비스")의 이용조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>

<h2>제 2 조 (용어의 정의)</h2>
<p>1. "서비스"란 회사가 제공하는 힐링 음악 스트리밍 및 관련 서비스를 말합니다.</p>
<p>2. "회원"이란 본 약관에 동의하고 서비스를 이용하는 자를 말합니다.</p>

<h2>제 3 조 (약관의 효력)</h2>
<p>본 약관은 서비스를 이용하고자 하는 모든 회원에게 적용됩니다.</p>`,
      type: 'POLICY' as const,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
    {
      slug: 'privacy-policy',
      title: '개인정보처리방침',
      content: `<h2>1. 개인정보의 수집 및 이용목적</h2>
<p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
<ul>
<li>서비스 제공에 관한 계약 이행</li>
<li>회원 관리 및 서비스 개선</li>
</ul>

<h2>2. 수집하는 개인정보 항목</h2>
<p>이메일, 닉네임, 선호 음악 카테고리</p>

<h2>3. 개인정보의 보유 및 이용기간</h2>
<p>회원 탈퇴 시까지 또는 관계 법령에 따른 보존 기간</p>`,
      type: 'POLICY' as const,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
    {
      slug: 'welcome-notice',
      title: 'Heeling에 오신 것을 환영합니다',
      content: `<h2>🎵 Heeling 소개</h2>
<p>Heeling은 일상의 스트레스를 날려줄 힐링 음악 서비스입니다.</p>

<h3>주요 기능</h3>
<ul>
<li>AI가 선별한 힐링 음악</li>
<li>집중, 수면, 명상 등 테마별 플레이리스트</li>
<li>개인화된 음악 추천</li>
</ul>

<p>편안한 음악과 함께 힐링되는 시간을 보내세요! 🎧</p>`,
      type: 'NOTICE' as const,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
    {
      slug: 'faq',
      title: '자주 묻는 질문',
      content: `<h2>Q. 무료로 이용할 수 있나요?</h2>
<p>A. 네, 기본 기능은 무료로 이용 가능합니다. 프리미엄 구독 시 광고 없이 모든 음악을 즐길 수 있습니다.</p>

<h2>Q. 오프라인에서도 들을 수 있나요?</h2>
<p>A. 프리미엄 회원은 음악을 다운로드하여 오프라인에서도 청취할 수 있습니다.</p>

<h2>Q. 음악 추천은 어떻게 이루어지나요?</h2>
<p>A. 사용자의 청취 기록과 선호도를 분석하여 AI가 맞춤 음악을 추천해 드립니다.</p>`,
      type: 'FAQ' as const,
      status: 'PUBLISHED' as const,
      publishedAt: new Date(),
    },
  ]

  for (const page of samplePages) {
    await prisma.page.create({
      data: page,
    })
  }

  console.log('✅ Created 4 sample pages')

  // ==========================================
  // 앱 설정 (AppConfig) 생성
  // ==========================================
  await prisma.appConfig.deleteMany()

  const appConfigs = [
    {
      key: 'version',
      value: JSON.stringify({
        current: '1.0.0',
        minimum: '1.0.0',
        recommended: '1.0.0',
        forceUpdate: false,
        updateUrl: {
          ios: 'https://apps.apple.com/app/heeling/id000000000',
          android: 'https://play.google.com/store/apps/details?id=app.heeling',
        },
      }),
      category: 'app',
    },
    {
      key: 'features',
      value: JSON.stringify({
        enableOfflineMode: true,
        enableBackgroundPlay: true,
        enableSocialSharing: true,
        enablePushNotifications: true,
        enableAnalytics: true,
        enableCrashReporting: true,
        maxOfflineTracks: 50,
        maxPlaylistSize: 100,
      }),
      category: 'features',
    },
    {
      key: 'ads',
      value: JSON.stringify({
        enabled: true,
        interstitialFrequency: 5,
        bannerEnabled: true,
        rewardedEnabled: true,
        freeTracksBeforeAd: 3,
      }),
      category: 'monetization',
    },
    {
      key: 'subscription',
      value: JSON.stringify({
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
      }),
      category: 'monetization',
    },
    {
      key: 'player',
      value: JSON.stringify({
        defaultVolume: 0.8,
        crossfadeDuration: 2,
        sleepTimerOptions: [15, 30, 45, 60, 90, 120],
        playbackRates: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
      }),
      category: 'player',
    },
    {
      key: 'support',
      value: JSON.stringify({
        email: 'support@heeling.app',
        faqUrl: 'https://heeling.app/faq',
        termsUrl: 'https://heeling.app/terms',
        privacyUrl: 'https://heeling.app/privacy',
      }),
      category: 'support',
    },
    {
      key: 'configVersion',
      value: '1',
      category: 'system',
    },
    {
      key: 'lastUpdated',
      value: new Date().toISOString(),
      category: 'system',
    },
  ]

  for (const config of appConfigs) {
    await prisma.appConfig.create({
      data: config,
    })
  }

  console.log('✅ Created 8 app configs')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
