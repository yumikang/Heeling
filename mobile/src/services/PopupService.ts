import { getFirstRow, runSql } from '../database';
import { PopupData, PopupResponse, UserType } from '../types';
import { API_BASE_URL } from '../constants';

// 본 팝업 기록 저장 키
const SEEN_POPUPS_KEY = 'seen_popup_ids';

// 서버 팝업 타입을 앱 타입으로 변환
interface ServerPopup {
  id: string;
  type: 'POPUP' | 'EVENT' | 'NOTICE' | 'PROMOTION';
  title: string;
  content: string;
  imageUrl: string | null;
  linkType: string | null;
  linkTarget: string | null;
  priority: number;
  showOnce: boolean;
  startDate: string | null;
  endDate: string | null;
}

const serverPopupToLocal = (popup: ServerPopup): PopupData => ({
  id: popup.id,
  type: 'modal',
  title: popup.title,
  message: popup.content,
  imageUrl: popup.imageUrl ? `${API_BASE_URL}${popup.imageUrl}` : undefined,
  buttons: [
    ...(popup.linkType && popup.linkTarget ? [{
      id: 'btn_action',
      label: '자세히 보기',
      action: popup.linkType === 'url' ? 'link' as const : 'screen' as const,
      value: popup.linkTarget,
      style: 'primary' as const,
    }] : []),
    {
      id: 'btn_close',
      label: '닫기',
      action: 'dismiss' as const,
      style: 'secondary' as const,
    },
  ],
  showOnce: popup.showOnce,
  showDontShowAgain: true,
  priority: popup.priority,
  dismissible: true,
  startDate: popup.startDate || undefined,
  endDate: popup.endDate || undefined,
});

export const PopupService = {
  /**
   * 백엔드에서 팝업 목록 가져오기
   */
  async fetchPopups(): Promise<PopupData[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/popups`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch popups');
      const data = await response.json();

      if (data.success && data.data) {
        return data.data.map(serverPopupToLocal);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch popups:', error);
      // 서버 연결 실패 시 목 데이터로 폴백
      return this.getMockPopups();
    }
  },

  /**
   * 표시 가능한 팝업 필터링
   */
  async getActivePopups(
    userType: UserType | null,
    isPremium: boolean = false
  ): Promise<PopupData[]> {
    const popups = await this.fetchPopups();
    const seenPopupIds = await this.getSeenPopupIds();
    const now = new Date();

    return popups
      .filter((popup) => {
        // 이미 본 팝업 체크
        // - showOnce가 true이거나
        // - showDontShowAgain이 true인 경우 기록 확인
        if (seenPopupIds.includes(popup.id)) {
          if (popup.showOnce || popup.showDontShowAgain) {
            return false;
          }
        }

        // 날짜 범위 체크
        if (popup.startDate && new Date(popup.startDate) > now) {
          return false;
        }
        if (popup.endDate && new Date(popup.endDate) < now) {
          return false;
        }

        // 타겟 유저 타입 체크
        if (popup.targetUserTypes && popup.targetUserTypes.length > 0) {
          if (!userType || !popup.targetUserTypes.includes(userType)) {
            return false;
          }
        }

        // 프리미엄 사용자 필터링
        if (popup.excludePremium && isPremium) {
          return false; // 프리미엄 사용자 제외
        }

        if (popup.requiresPremium && !isPremium) {
          return false; // 프리미엄 사용자만
        }

        return true;
      })
      .sort((a, b) => b.priority - a.priority); // 우선순위 높은 순
  },

  /**
   * 본 팝업 ID 목록 가져오기
   */
  async getSeenPopupIds(): Promise<string[]> {
    try {
      const row = await getFirstRow<{ value: string }>(
        'SELECT value FROM app_metadata WHERE key = ?',
        [SEEN_POPUPS_KEY]
      );
      if (row?.value) {
        return JSON.parse(row.value);
      }
      return [];
    } catch (error) {
      console.error('Failed to get seen popup ids:', error);
      return [];
    }
  },

  /**
   * 팝업을 본 것으로 기록
   */
  async markPopupAsSeen(popupId: string): Promise<void> {
    try {
      const seenIds = await this.getSeenPopupIds();
      if (!seenIds.includes(popupId)) {
        seenIds.push(popupId);
        await runSql(
          `INSERT INTO app_metadata (key, value, updated_at)
           VALUES (?, ?, datetime('now'))
           ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
          [SEEN_POPUPS_KEY, JSON.stringify(seenIds), JSON.stringify(seenIds)]
        );
      }
    } catch (error) {
      console.error('Failed to mark popup as seen:', error);
    }
  },

  /**
   * 본 팝업 기록 초기화 (디버깅용)
   */
  async resetSeenPopups(): Promise<void> {
    try {
      await runSql('DELETE FROM app_metadata WHERE key = ?', [SEEN_POPUPS_KEY]);
    } catch (error) {
      console.error('Failed to reset seen popups:', error);
    }
  },

  /**
   * 개발용 목 데이터
   */
  getMockPopups(): PopupData[] {
    return [
      // 전체화면 팝업 예시 (신규 기능 안내) - 테스트용으로 비활성화
      /* {
        id: 'fullscreen_new_feature_001',
        type: 'fullscreen',
        title: '새로운 수면 트랙 출시!',
        message: '깊은 수면을 위한 새로운 자연 소리 트랙을 만나보세요.',
        imageUrl: 'https://picsum.photos/400/600',
        backgroundColor: '#1a1a2e',
        buttons: [
          {
            id: 'btn_explore',
            label: '지금 들어보기',
            action: 'screen',
            value: 'Library',
            style: 'primary',
          },
          {
            id: 'btn_later',
            label: '나중에',
            action: 'dismiss',
            style: 'text',
          },
        ],
        showOnce: true,
        priority: 100,
        dismissible: false,
        fullscreenOptions: {
          showCloseButton: true,
          closeButtonDelay: 3, // 3초 후 닫기 버튼 표시
        },
      }, */
      // 일반 모달 팝업 예시 (이벤트 안내)
      {
        id: 'modal_event_001',
        type: 'modal',
        title: '프리미엄 50% 할인',
        message: '이번 주말까지만! 프리미엄 구독을 50% 할인된 가격에 만나보세요.',
        imageUrl: 'https://picsum.photos/300/200',
        buttons: [
          {
            id: 'btn_premium',
            label: '자세히 보기',
            action: 'screen',
            value: 'Premium',
            style: 'primary',
          },
          {
            id: 'btn_close',
            label: '닫기',
            action: 'dismiss',
            style: 'secondary',
          },
        ],
        showOnce: false, // 매번 표시
        showDontShowAgain: true, // "다시 보지 않기" 버튼 표시
        excludePremium: true, // 프리미엄 사용자에게는 표시 안 함
        priority: 50,
        dismissible: true,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      },
      // 특정 사용자 타입 대상 팝업 - 테스트용으로 비활성화
      /* {
        id: 'modal_business_001',
        type: 'modal',
        title: '비즈니스 전용 BGM 패키지',
        message: '카페, 매장에 어울리는 프리미엄 BGM 패키지를 확인해보세요.',
        buttons: [
          {
            id: 'btn_check',
            label: '패키지 보기',
            action: 'link',
            value: 'https://heeling.app/business',
            style: 'primary',
          },
          {
            id: 'btn_skip',
            label: '건너뛰기',
            action: 'dismiss',
            style: 'text',
          },
        ],
        showOnce: true,
        targetUserTypes: ['business'],
        priority: 80,
        dismissible: true,
      }, */
    ];
  },
};

export default PopupService;
