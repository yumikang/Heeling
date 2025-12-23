/**
 * Firebase Analytics Service
 * 앱 사용 통계 및 이벤트 추적
 */

import analytics from '@react-native-firebase/analytics';

export const AnalyticsService = {
  /**
   * 화면 조회 추적
   */
  async logScreenView(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.warn('Analytics screen view error:', error);
    }
  },

  /**
   * 트랙 재생 이벤트
   */
  async logTrackPlay(trackId: string, trackTitle: string, category?: string) {
    try {
      await analytics().logEvent('track_play', {
        track_id: trackId,
        track_title: trackTitle,
        category: category || 'unknown',
        timestamp: Date.now(),
      });
    } catch (error) {
      console.warn('Analytics track play error:', error);
    }
  },

  /**
   * 트랙 완료 이벤트 (끝까지 들음)
   */
  async logTrackComplete(trackId: string, trackTitle: string, duration: number) {
    try {
      await analytics().logEvent('track_complete', {
        track_id: trackId,
        track_title: trackTitle,
        duration_seconds: duration,
      });
    } catch (error) {
      console.warn('Analytics track complete error:', error);
    }
  },

  /**
   * 검색 이벤트
   */
  async logSearch(searchTerm: string, resultsCount: number) {
    try {
      await analytics().logSearch({
        search_term: searchTerm,
      });
      await analytics().logEvent('search_results', {
        search_term: searchTerm,
        results_count: resultsCount,
      });
    } catch (error) {
      console.warn('Analytics search error:', error);
    }
  },

  /**
   * 즐겨찾기 추가
   */
  async logAddFavorite(trackId: string, trackTitle: string) {
    try {
      await analytics().logEvent('add_favorite', {
        track_id: trackId,
        track_title: trackTitle,
      });
    } catch (error) {
      console.warn('Analytics add favorite error:', error);
    }
  },

  /**
   * 즐겨찾기 제거
   */
  async logRemoveFavorite(trackId: string) {
    try {
      await analytics().logEvent('remove_favorite', {
        track_id: trackId,
      });
    } catch (error) {
      console.warn('Analytics remove favorite error:', error);
    }
  },

  /**
   * 수면 타이머 설정
   */
  async logSleepTimerSet(minutes: number) {
    try {
      await analytics().logEvent('sleep_timer_set', {
        duration_minutes: minutes,
      });
    } catch (error) {
      console.warn('Analytics sleep timer error:', error);
    }
  },

  /**
   * 카테고리 선택
   */
  async logCategorySelect(categoryId: string, categoryName: string) {
    try {
      await analytics().logEvent('category_select', {
        category_id: categoryId,
        category_name: categoryName,
      });
    } catch (error) {
      console.warn('Analytics category select error:', error);
    }
  },

  /**
   * 플레이리스트 재생
   */
  async logPlaylistPlay(playlistId: string, playlistName: string) {
    try {
      await analytics().logEvent('playlist_play', {
        playlist_id: playlistId,
        playlist_name: playlistName,
      });
    } catch (error) {
      console.warn('Analytics playlist play error:', error);
    }
  },

  /**
   * 사용자 속성 설정
   */
  async setUserProperties(properties: {
    userType?: string;
    subscriptionTier?: string;
    preferredCategory?: string;
  }) {
    try {
      if (properties.userType) {
        await analytics().setUserProperty('user_type', properties.userType);
      }
      if (properties.subscriptionTier) {
        await analytics().setUserProperty('subscription_tier', properties.subscriptionTier);
      }
      if (properties.preferredCategory) {
        await analytics().setUserProperty('preferred_category', properties.preferredCategory);
      }
    } catch (error) {
      console.warn('Analytics set user properties error:', error);
    }
  },

  /**
   * 사용자 ID 설정
   */
  async setUserId(userId: string | null) {
    try {
      await analytics().setUserId(userId);
    } catch (error) {
      console.warn('Analytics set user id error:', error);
    }
  },

  /**
   * 앱 오픈 이벤트
   */
  async logAppOpen() {
    try {
      await analytics().logAppOpen();
    } catch (error) {
      console.warn('Analytics app open error:', error);
    }
  },

  /**
   * 커스텀 이벤트
   */
  async logEvent(eventName: string, params?: Record<string, any>) {
    try {
      await analytics().logEvent(eventName, params);
    } catch (error) {
      console.warn(`Analytics event ${eventName} error:`, error);
    }
  },
};

export default AnalyticsService;
