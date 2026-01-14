/**
 * Heeling - Healing Music App
 * Main Application Entry Point
 */

import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar, LogBox, Alert, Linking } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import TrackPlayer from 'react-native-track-player';
import { RootNavigator } from './src/app/navigation/RootNavigator';
import { Colors } from './src/constants';
import { NetworkService, AnalyticsService, SyncService, FCMService } from './src/services';
import { ErrorBoundary } from './src/components/common';
import { PopupManager } from './src/components/popup/PopupManager';
import { useUserStore } from './src/stores/userStore';
import { useAuthStore } from './src/stores/authStore';
import { RootStackParamList } from './src/types';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Navigation ref for deep linking
const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

function App(): React.JSX.Element {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { userType } = useUserStore();
  const { user } = useAuthStore();

  // Handle FCM notification navigation
  const handleNotificationNavigation = useCallback((data: { [key: string]: string } | undefined) => {
    if (!data) return;

    // Handle different notification types
    if (data.screen) {
      // Navigate to specific screen
      setTimeout(() => {
        // @ts-ignore - dynamic screen navigation from push notification
        navigationRef.current?.navigate(data.screen);
      }, 500);
    } else if (data.trackId) {
      // Navigate to player with track
      setTimeout(() => {
        navigationRef.current?.navigate('Player', { trackId: data.trackId });
      }, 500);
    } else if (data.deeplink) {
      // Handle external deeplink
      Linking.openURL(data.deeplink);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Initialize NetworkService (start listening for network changes)
        await NetworkService.initialize();

        // Check network status and show message if offline
        const networkStatus = NetworkService.getNetworkStatus();
        if (networkStatus === 'none') {
          // Show friendly offline message instead of crashing
          Alert.alert(
            '인터넷 연결 없음',
            '네트워크 연결을 확인해주세요.\n오프라인 모드로 계속하시면 다운로드된 음악만 재생할 수 있습니다.',
            [
              {
                text: '오프라인으로 계속',
                style: 'default',
              },
            ],
            { cancelable: true }
          );
          console.log('[App] ⚠️ No network connection - running in offline mode');
        }

        // Log app open event to Firebase Analytics (only if online)
        if (networkStatus !== 'none') {
          await AnalyticsService.logAppOpen();
        }

        // Initialize FCM for push notifications (only if online)
        if (networkStatus !== 'none') {
          const fcmEnabled = await FCMService.initialize();
          if (fcmEnabled) {
            console.log('[App] ✅ FCM initialized');

            // Check if app was opened from a notification
            const initialNotification = await FCMService.getInitialNotification();
            if (initialNotification?.data) {
              console.log('[App] App opened from notification:', initialNotification.data);
              handleNotificationNavigation(initialNotification.data);
            }
          }
        }

        // Check if player is already initialized
        const isSetup = await TrackPlayer.isServiceRunning();
        if (!isSetup) {
          await TrackPlayer.setupPlayer({
            autoHandleInterruptions: true,
          });
        }
        setIsPlayerReady(true);

        // VPS ↔ SQLite 동기화 (백그라운드, 온라인일 때만)
        if (networkStatus !== 'none') {
          initSync();
        }
      } catch (error) {
        // Player might already be initialized
        console.log('App initialization:', error);
        setIsPlayerReady(true);
      }
    };

    const initSync = async () => {
      try {
        const needsSync = await SyncService.needsSync();
        if (needsSync) {
          console.log('[App] Starting VPS ↔ SQLite sync...');
          const result = await SyncService.syncTracks();
          console.log(`[App] ✅ Sync complete: ${result.added} added, ${result.updated} updated, ${result.deleted} deleted`);
        } else {
          console.log('[App] Sync not needed (synced within last hour)');
        }
      } catch (error) {
        console.error('[App] ❌ Sync failed:', error);
        // 동기화 실패해도 앱은 계속 작동 (오프라인 지원)
      }
    };

    initApp();

    // Cleanup network listener on unmount
    return () => {
      NetworkService.cleanup();
    };
  }, [handleNotificationNavigation]);

  // Setup FCM notification listeners
  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;
    let unsubscribeOpened: (() => void) | undefined;

    const setupNotificationListeners = async () => {
      // Foreground notification handler
      unsubscribeForeground = await FCMService.onForegroundMessage((message) => {
        console.log('[App] Foreground notification:', message);

        // Show alert for foreground notifications
        if (message.notification) {
          Alert.alert(
            message.notification.title || '알림',
            message.notification.body || '',
            [
              { text: '닫기', style: 'cancel' },
              {
                text: '보기',
                onPress: () => handleNotificationNavigation(message.data),
              },
            ]
          );
        }
      });

      // Background/quit notification opened handler
      unsubscribeOpened = await FCMService.onNotificationOpened((message) => {
        console.log('[App] Notification opened:', message);
        handleNotificationNavigation(message.data);
      });
    };

    setupNotificationListeners();

    return () => {
      unsubscribeForeground?.();
      unsubscribeOpened?.();
    };
  }, [handleNotificationNavigation]);

  // Don't render the app until TrackPlayer is ready
  // This prevents hooks from react-native-track-player from failing
  if (!isPlayerReady) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={Colors.background}
          translucent={false}
        />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <SafeAreaProvider>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Colors.background}
            translucent={false}
          />
          <NavigationContainer
            ref={navigationRef}
            theme={{
              dark: true,
              colors: {
                primary: Colors.primary,
                background: Colors.background,
                card: Colors.surface,
                text: Colors.text,
                border: Colors.border,
                notification: Colors.accent,
              },
              fonts: {
                regular: {
                  fontFamily: 'System',
                  fontWeight: '400',
                },
                medium: {
                  fontFamily: 'System',
                  fontWeight: '500',
                },
                bold: {
                  fontFamily: 'System',
                  fontWeight: '700',
                },
                heavy: {
                  fontFamily: 'System',
                  fontWeight: '900',
                },
              },
            }}
          >
            <RootNavigator />
            <PopupManager
              userType={userType}
              isPremium={user?.isPremium ?? false}
            />
          </NavigationContainer>
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

export default App;
