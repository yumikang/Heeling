import React, { useState, useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { RootStackParamList } from '../../types';
import { Colors, Typography, Spacing } from '../../constants';
import { ErrorLogger } from '../../services/ErrorLogger';
import {
  usePlayer,
  useSleepTimer,
  useBrightness,
  useDownload,
  useVolumeIndicator,
  usePlayerGestures,
  useClockTimer,
} from '../../hooks';
import { usePlayerStore, useFavoritesStore } from '../../stores';
import {
  ClockModeContent,
  ImmersiveModeContent,
  NormalModeContent,
  SleepTimerModal,
  BrightnessModal,
  VolumeIndicator,
} from '../../components';

const logger = ErrorLogger.forScreen('PlayerScreen');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;
type PlayerRouteProp = RouteProp<RootStackParamList, 'Player'>;

const PlayerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PlayerRouteProp>();

  const {
    currentTrack,
    isPlaying,
    progress,
    isRepeat,
    isShuffle,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    togglePlayMode,
  } = usePlayer();

  const { isImmersiveMode, toggleImmersiveMode } = usePlayerStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { sleepTimer, isTimerActive, formatRemainingTime, startTimer, cancelTimer } = useSleepTimer();
  const { brightness, setBrightness } = useBrightness();
  const { downloadTrack, getDownloadStatus } = useDownload();

  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showBrightnessModal, setShowBrightnessModal] = useState(false);
  const [isClockMode, setIsClockMode] = useState(false);
  const isMountedRef = useRef(true);

  // Custom hooks
  const { currentVolume, showVolumeSlider, volumeOpacity } = useVolumeIndicator(isMountedRef);
  const { currentTime } = useClockTimer(isClockMode, isMountedRef);
  const { translateY, modeIndicatorOpacity, panGesture, doubleTap, longPress } = usePlayerGestures({
    isImmersiveMode,
    isClockMode,
    toggleImmersiveMode,
    setIsClockMode,
    onGoBack: navigation.goBack,
  });

  useEffect(() => {
    logger.info('mount', 'PlayerScreen mounted', { trackId: currentTrack?.id });
    isMountedRef.current = true;

    return () => {
      logger.info('unmount', 'PlayerScreen unmounting');
      isMountedRef.current = false;
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const modeIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modeIndicatorOpacity.value,
  }));

  const handleClose = () => navigation.goBack();

  const handleFavoritePress = () => {
    if (currentTrack) {
      toggleFavorite(currentTrack.id);
    }
  };

  const handleDownloadPress = () => {
    if (currentTrack) {
      downloadTrack(currentTrack);
    }
  };

  const handleSleepTimerSelect = (minutes: number | null) => {
    if (minutes === null) {
      cancelTimer();
    } else {
      startTimer(minutes);
    }
    setShowSleepTimerModal(false);
  };

  const downloadStatus = currentTrack ? getDownloadStatus(currentTrack.id) : null;

  if (!currentTrack) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>재생 중인 트랙이 없습니다</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureDetector gesture={Gesture.Race(panGesture, doubleTap, longPress)}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <StatusBar barStyle="light-content" hidden={isImmersiveMode} />

        {/* Background Image */}
        <Image
          source={{ uri: currentTrack.backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.backgroundOverlay} />

        {/* Brightness Dim Overlay */}
        <View style={[styles.dimOverlay, { opacity: 1 - brightness }]} pointerEvents="none" />

        {/* Mode Indicator */}
        <Animated.View style={[styles.modeIndicator, modeIndicatorAnimatedStyle]}>
          <Text style={styles.modeIndicatorText}>꾹 눌러 돌아가기</Text>
        </Animated.View>

        {/* Content based on mode */}
        {isImmersiveMode && isClockMode ? (
          <ClockModeContent
            currentTime={currentTime}
            isPlaying={isPlaying}
            isTimerActive={isTimerActive}
            formatRemainingTime={formatRemainingTime}
          />
        ) : isImmersiveMode ? (
          <ImmersiveModeContent
            isPlaying={isPlaying}
            onPlayPause={togglePlayPause}
            onSkipPrevious={skipToPrevious}
            onSkipNext={skipToNext}
          />
        ) : (
          <NormalModeContent
            track={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            isRepeat={isRepeat}
            isShuffle={isShuffle}
            isFavorite={isFavorite(currentTrack.id)}
            isTimerActive={isTimerActive}
            formatRemainingTime={formatRemainingTime}
            brightness={brightness}
            downloadStatus={downloadStatus}
            onClose={handleClose}
            onPlayPause={togglePlayPause}
            onSkipPrevious={skipToPrevious}
            onSkipNext={skipToNext}
            onSeek={seekTo}
            onTogglePlayMode={togglePlayMode}
            onFavoritePress={handleFavoritePress}
            onDownloadPress={handleDownloadPress}
            onBrightnessPress={() => setShowBrightnessModal(true)}
            onSleepTimerPress={() => setShowSleepTimerModal(true)}
          />
        )}

        {/* Volume Indicator */}
        {!isImmersiveMode && (
          <VolumeIndicator
            visible={showVolumeSlider}
            volume={currentVolume}
            volumeOpacity={volumeOpacity}
          />
        )}

        {/* Modals */}
        <SleepTimerModal
          visible={showSleepTimerModal}
          currentTimer={sleepTimer}
          onSelect={handleSleepTimerSelect}
          onClose={() => setShowSleepTimerModal(false)}
        />

        <BrightnessModal
          visible={showBrightnessModal}
          brightness={brightness}
          onBrightnessChange={setBrightness}
          onClose={() => setShowBrightnessModal(false)}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dimOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 1,
  },
  modeIndicator: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 1000,
  },
  modeIndicatorText: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  closeText: {
    ...Typography.bodyMedium,
    color: Colors.primary,
  },
});

export default memo(PlayerScreen);
