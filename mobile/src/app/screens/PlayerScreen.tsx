import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { VolumeManager } from 'react-native-volume-manager';
import Orientation from 'react-native-orientation-locker';
import { RootStackParamList } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, SLEEP_TIMER_OPTIONS, BRIGHTNESS_PRESETS } from '../../constants';
import { usePlayer, useSleepTimer, useBrightness, useDownload } from '../../hooks';
import { usePlayerStore, useFavoritesStore } from '../../stores';
import { CustomSlider } from '../../components';

// Brightness icon based on level
const getBrightnessIcon = (brightness: number): string => {
  if (brightness <= 0.3) return 'sunny-outline';
  if (brightness <= 0.7) return 'partly-sunny-outline';
  return 'sunny';
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Player'>;
type PlayerRouteProp = RouteProp<RootStackParamList, 'Player'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VOLUME_SLIDER_HEIGHT = 150;
const VOLUME_HIDE_DELAY = 2500; // 2.5 seconds

// Format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Format current time for clock face
const formatClockTime = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format date for clock face
const formatClockDate = (date: Date): string => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayOfWeek = days[date.getDay()];
  return `${month}월 ${day}일 ${dayOfWeek}요일`;
};

const PlayerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PlayerRouteProp>();

  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    isRepeat,
    isShuffle,
    togglePlayPause,
    skipToNext,
    skipToPrevious,
    seekTo,
    setVolume,
    togglePlayMode,
  } = usePlayer();

  const { isImmersiveMode, toggleImmersiveMode } = usePlayerStore();
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const { sleepTimer, isTimerActive, formatRemainingTime, startTimer, cancelTimer } = useSleepTimer();
  const { brightness, setBrightness } = useBrightness();
  const { downloadTrack, getDownloadStatus, getDownloadProgress } = useDownload();

  const [showSleepTimerModal, setShowSleepTimerModal] = useState(false);
  const [showBrightnessModal, setShowBrightnessModal] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [isClockMode, setIsClockMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const volumeHideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useSharedValue(0);
  const volumeOpacity = useSharedValue(0);
  const modeIndicatorOpacity = useSharedValue(0);

  // Handle mode indicator visibility
  const showModeIndicator = useCallback(() => {
    modeIndicatorOpacity.value = withTiming(1, { duration: 200 });

    // Clear existing timer
    if (modeIndicatorTimer.current) {
      clearTimeout(modeIndicatorTimer.current);
    }

    // Set new hide timer (2 seconds)
    modeIndicatorTimer.current = setTimeout(() => {
      modeIndicatorOpacity.value = withTiming(0, { duration: 300 });
    }, 2000);
  }, []);

  // Handle volume slider visibility
  const showVolumeIndicator = useCallback(() => {
    setShowVolumeSlider(true);
    volumeOpacity.value = withTiming(1, { duration: 150 });

    // Clear existing timer
    if (volumeHideTimer.current) {
      clearTimeout(volumeHideTimer.current);
    }

    // Set new hide timer
    volumeHideTimer.current = setTimeout(() => {
      volumeOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => setShowVolumeSlider(false), 300);
    }, VOLUME_HIDE_DELAY);
  }, []);

  // Listen for hardware volume button changes
  useEffect(() => {
    let volumeListener: { remove: () => void } | null = null;

    const setupVolumeListener = async () => {
      try {
        // Get initial volume
        const result = await VolumeManager.getVolume();
        setCurrentVolume(result.volume);

        // Listen for volume changes (hardware buttons)
        volumeListener = VolumeManager.addVolumeListener((res) => {
          setCurrentVolume(res.volume);
          showVolumeIndicator();
        });
      } catch (error) {
        // VolumeManager not available (native module not linked)
        console.warn('VolumeManager not available:', error);
      }
    };

    setupVolumeListener();

    return () => {
      volumeListener?.remove();
      if (volumeHideTimer.current) {
        clearTimeout(volumeHideTimer.current);
      }
    };
  }, [showVolumeIndicator]);

  // Update clock every second when in clock mode
  useEffect(() => {
    if (isClockMode) {
      setCurrentTime(new Date());
      clockTimer.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }

    return () => {
      if (clockTimer.current) {
        clearInterval(clockTimer.current);
      }
    };
  }, [isClockMode]);

  // Handle orientation change for clock mode (landscape)
  useEffect(() => {
    if (isClockMode) {
      // Lock to landscape when entering clock mode
      Orientation.lockToLandscapeRight();
    } else {
      // Lock back to portrait when leaving clock mode
      Orientation.lockToPortrait();
    }

    // Cleanup: ensure portrait on unmount
    return () => {
      Orientation.lockToPortrait();
    };
  }, [isClockMode]);

  // Cleanup mode indicator timer on unmount
  useEffect(() => {
    return () => {
      if (modeIndicatorTimer.current) {
        clearTimeout(modeIndicatorTimer.current);
      }
    };
  }, []);

  const volumeSliderAnimatedStyle = useAnimatedStyle(() => ({
    opacity: volumeOpacity.value,
  }));

  const modeIndicatorAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modeIndicatorOpacity.value,
  }));

  // Swipe down to close gesture
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        runOnJS(navigation.goBack)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Handle mode transitions
  const handleDoubleTap = useCallback(() => {
    if (!isImmersiveMode) {
      // Normal → Immersive
      toggleImmersiveMode();
      showModeIndicator();
    } else if (!isClockMode) {
      // Immersive → Clock
      setIsClockMode(true);
      showModeIndicator();
    } else {
      // Clock → Immersive
      setIsClockMode(false);
      showModeIndicator();
    }
  }, [isImmersiveMode, isClockMode, toggleImmersiveMode, showModeIndicator]);

  const handleLongPress = useCallback(() => {
    // Long press: Return to normal mode from immersive/clock
    if (isImmersiveMode || isClockMode) {
      setIsClockMode(false);
      if (isImmersiveMode) {
        toggleImmersiveMode();
      }
      showModeIndicator();
    }
  }, [isImmersiveMode, isClockMode, toggleImmersiveMode, showModeIndicator]);

  // Double tap gesture
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  // Long press gesture (500ms)
  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      runOnJS(handleLongPress)();
    });

  const handleClose = () => {
    navigation.goBack();
  };

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

  // Get download status for current track
  const downloadStatus = currentTrack ? getDownloadStatus(currentTrack.id) : null;
  const downloadProgress = currentTrack ? getDownloadProgress(currentTrack.id) : 0;

  const handleSleepTimerSelect = (minutes: number | null) => {
    if (minutes === null) {
      cancelTimer();
    } else {
      startTimer(minutes as any);
    }
    setShowSleepTimerModal(false);
  };

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

        {/* Background Image - Fullscreen Cover */}
        <Image
          source={{ uri: currentTrack.backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <View style={styles.backgroundOverlay} />

        {/* Brightness Dim Overlay - opacity based on brightness value */}
        <View
          style={[
            styles.dimOverlay,
            { opacity: 1 - brightness }
          ]}
          pointerEvents="none"
        />

        {/* Mode Indicator */}
        <Animated.View style={[styles.modeIndicator, modeIndicatorAnimatedStyle]}>
          <Text style={styles.modeIndicatorText}>꾹 눌러 돌아가기</Text>
        </Animated.View>

        {/* Clock Mode - iOS StandBy Style (Landscape) */}
        {isImmersiveMode && isClockMode ? (
          <View style={styles.clockContent}>
            {/* Large Time Display - iOS StandBy Style */}
            <View style={styles.clockTimeContainer}>
              <Text style={styles.clockHour}>
                {currentTime.getHours().toString().padStart(2, '0')}
              </Text>
              <View style={styles.clockColonContainer}>
                <View style={styles.clockColonDot} />
                <View style={styles.clockColonDot} />
              </View>
              <Text style={styles.clockMinute}>
                {currentTime.getMinutes().toString().padStart(2, '0')}
              </Text>
            </View>

            {/* Timer indicator - positioned at top right */}
            {isTimerActive && (
              <View style={styles.clockTimerContainer}>
                <Icon name="moon" size={14} color={Colors.primary} />
                <Text style={styles.clockTimerText}>{formatRemainingTime()}</Text>
              </View>
            )}

            {/* Play indicator - positioned at top left */}
            <View style={styles.clockPlayIndicator}>
              <Icon
                name={isPlaying ? 'musical-notes' : 'pause'}
                size={18}
                color="rgba(255, 255, 255, 0.4)"
              />
            </View>
          </View>
        ) : isImmersiveMode ? (
          /* Immersive Mode - Full screen centered controls */
          <View style={styles.immersiveContent}>
            <View style={styles.controlsImmersive}>
              <TouchableOpacity
                onPress={skipToPrevious}
                style={styles.skipButtonImmersive}
              >
                <Icon
                  name="play-skip-back"
                  size={44}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playButtonImmersive}
              >
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={56}
                  color="rgba(255, 255, 255, 0.85)"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipToNext}
                style={styles.skipButtonImmersive}
              >
                <Icon
                  name="play-skip-forward"
                  size={44}
                  color="rgba(255, 255, 255, 0.7)"
                />
              </TouchableOpacity>
            </View>

            {/* Hint for clock mode */}
            <Text style={styles.immersiveHint}>더블 탭으로 시계 모드</Text>
          </View>
        ) : (
          <SafeAreaView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Icon name="chevron-down" size={28} color={Colors.text} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Now Playing</Text>
                {isTimerActive && (
                  <Text style={styles.timerText}>{formatRemainingTime()}</Text>
                )}
              </View>
              <View style={styles.headerRightButtons}>
                {/* Download Button */}
                <TouchableOpacity
                  onPress={handleDownloadPress}
                  style={styles.headerButton}
                  disabled={downloadStatus === 'downloading'}
                >
                  {downloadStatus === 'downloading' ? (
                    <View style={styles.downloadingContainer}>
                      <ActivityIndicator size="small" color={Colors.primary} />
                    </View>
                  ) : downloadStatus === 'completed' ? (
                    <Icon name="checkmark-circle" size={24} color={Colors.primary} />
                  ) : (
                    <Icon name="download-outline" size={24} color={Colors.text} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowBrightnessModal(true)}
                  style={styles.headerButton}
                >
                  <Icon
                    name={getBrightnessIcon(brightness)}
                    size={24}
                    color={brightness < 1 ? Colors.primary : Colors.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowSleepTimerModal(true)}
                  style={styles.headerButton}
                >
                  <Icon
                    name={isTimerActive ? 'moon' : 'moon-outline'}
                    size={24}
                    color={isTimerActive ? Colors.primary : Colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Spacer to push content down */}
            <View style={styles.spacer} />

            {/* Track Info */}
            <View style={styles.trackInfo}>
              {currentTrack.tags && currentTrack.tags.length > 0 && (
                <View style={styles.tags}>
                  {currentTrack.tags.slice(0, 3).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Text style={styles.title}>{currentTrack.title}</Text>
              <Text style={styles.artist}>{currentTrack.artist}</Text>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <CustomSlider
                min={0}
                max={progress.duration || 100}
                value={progress.position}
                onSlidingComplete={seekTo}
                trackHeight={4}
                thumbSize={14}
              />
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
                <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
              </View>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity onPress={togglePlayMode} style={styles.sideButton}>
                <Icon
                  name={isShuffle ? "shuffle" : "repeat"}
                  size={22}
                  color={isRepeat || isShuffle ? Colors.primary : Colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipToPrevious}
                style={styles.skipButton}
              >
                <Icon
                  name="play-skip-back-outline"
                  size={28}
                  color={Colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={togglePlayPause}
                style={styles.playButton}
              >
                <Icon
                  name={isPlaying ? 'pause' : 'play'}
                  size={36}
                  color={Colors.text}
                  style={!isPlaying ? { marginLeft: 4 } : undefined}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={skipToNext}
                style={styles.skipButton}
              >
                <Icon
                  name="play-skip-forward-outline"
                  size={28}
                  color={Colors.text}
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleFavoritePress} style={styles.sideButton}>
                <Icon
                  name={isFavorite(currentTrack.id) ? 'heart' : 'heart-outline'}
                  size={22}
                  color={isFavorite(currentTrack.id) ? Colors.error : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Hint */}
            <Text style={styles.hint}>더블 탭으로 몰입 모드 전환</Text>
          </SafeAreaView>
        )}

        {/* Vertical Volume Slider (Right Side) - Hidden in immersive mode */}
        {showVolumeSlider && !isImmersiveMode && (
          <Animated.View style={[styles.verticalVolumeContainer, volumeSliderAnimatedStyle]}>
            <Icon name="volume-high" size={18} color={Colors.text} />
            <View style={styles.verticalVolumeTrack}>
              <View
                style={[
                  styles.verticalVolumeFill,
                  { height: `${currentVolume * 100}%` },
                ]}
              />
            </View>
            <Icon name="volume-low" size={18} color={Colors.textSecondary} />
          </Animated.View>
        )}

        {/* Sleep Timer Modal */}
        {showSleepTimerModal && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowSleepTimerModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>수면 타이머</Text>
              {[...SLEEP_TIMER_OPTIONS, null].map((option) => (
                <TouchableOpacity
                  key={option ?? 'off'}
                  style={[
                    styles.timerOption,
                    sleepTimer === option && styles.timerOptionSelected,
                  ]}
                  onPress={() => handleSleepTimerSelect(option)}
                >
                  <Text style={[
                    styles.timerOptionText,
                    sleepTimer === option && styles.timerOptionTextSelected,
                  ]}>
                    {option === null ? '끄기' : `${option}분`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Brightness Control Modal */}
        {showBrightnessModal && (
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowBrightnessModal(false)}
          >
            <Pressable style={styles.brightnessModalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>화면 밝기</Text>

              {/* Brightness Slider */}
              <View style={styles.brightnessSliderContainer}>
                <Icon name="moon" size={20} color={Colors.textSecondary} />
                <View style={styles.brightnessSliderWrapper}>
                  <CustomSlider
                    min={0.05}
                    max={1}
                    value={brightness}
                    onSlidingComplete={setBrightness}
                    trackHeight={6}
                    thumbSize={20}
                  />
                </View>
                <Icon name="sunny" size={20} color={Colors.primary} />
              </View>

              {/* Current brightness percentage */}
              <Text style={styles.brightnessValue}>{Math.round(brightness * 100)}%</Text>

              {/* Preset buttons */}
              <View style={styles.brightnessPresets}>
                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    brightness === BRIGHTNESS_PRESETS.sleep && styles.presetButtonActive,
                  ]}
                  onPress={() => setBrightness(BRIGHTNESS_PRESETS.sleep)}
                >
                  <Icon name="bed" size={18} color={brightness === BRIGHTNESS_PRESETS.sleep ? Colors.background : Colors.text} />
                  <Text style={[
                    styles.presetText,
                    brightness === BRIGHTNESS_PRESETS.sleep && styles.presetTextActive,
                  ]}>수면</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    brightness === BRIGHTNESS_PRESETS.meditation && styles.presetButtonActive,
                  ]}
                  onPress={() => setBrightness(BRIGHTNESS_PRESETS.meditation)}
                >
                  <Icon name="leaf" size={18} color={brightness === BRIGHTNESS_PRESETS.meditation ? Colors.background : Colors.text} />
                  <Text style={[
                    styles.presetText,
                    brightness === BRIGHTNESS_PRESETS.meditation && styles.presetTextActive,
                  ]}>명상</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    brightness === BRIGHTNESS_PRESETS.relax && styles.presetButtonActive,
                  ]}
                  onPress={() => setBrightness(BRIGHTNESS_PRESETS.relax)}
                >
                  <Icon name="cafe" size={18} color={brightness === BRIGHTNESS_PRESETS.relax ? Colors.background : Colors.text} />
                  <Text style={[
                    styles.presetText,
                    brightness === BRIGHTNESS_PRESETS.relax && styles.presetTextActive,
                  ]}>휴식</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.presetButton,
                    brightness === BRIGHTNESS_PRESETS.normal && styles.presetButtonActive,
                  ]}
                  onPress={() => setBrightness(BRIGHTNESS_PRESETS.normal)}
                >
                  <Icon name="sunny" size={18} color={brightness === BRIGHTNESS_PRESETS.normal ? Colors.background : Colors.text} />
                  <Text style={[
                    styles.presetText,
                    brightness === BRIGHTNESS_PRESETS.normal && styles.presetTextActive,
                  ]}>일반</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </TouchableOpacity>
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  immersiveContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  immersiveHint: {
    ...Typography.small,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: Spacing.xl * 2,
  },
  // Clock Mode Styles - iOS StandBy Style
  clockContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  clockTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHour: {
    fontSize: 240,
    fontWeight: '200',
    color: '#5AC8FA', // iOS Blue
    letterSpacing: -12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  clockColonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 36,
    marginHorizontal: 4,
    height: 180,
  },
  clockColonDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  clockMinute: {
    fontSize: 240,
    fontWeight: '200',
    color: '#5AC8FA', // iOS Blue
    letterSpacing: -12,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  clockDate: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: Spacing.md,
    letterSpacing: 1,
  },
  clockTimerContainer: {
    position: 'absolute',
    top: 40,
    right: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  clockTimerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  clockPlayIndicator: {
    position: 'absolute',
    top: 40,
    left: 40,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  downloadingContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
  },
  timerText: {
    ...Typography.small,
    color: Colors.primary,
    marginTop: 2,
  },
  spacer: {
    flex: 1,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  tags: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  tagText: {
    ...Typography.small,
    color: Colors.text,
  },
  title: {
    ...Typography.heading2,
    color: Colors.text,
    textAlign: 'center',
  },
  artist: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  progressContainer: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  timeText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  controlsImmersive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  sideButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonImmersive: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonImmersive: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalVolumeContainer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -VOLUME_SLIDER_HEIGHT / 2 - 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  verticalVolumeTrack: {
    width: 4,
    height: VOLUME_SLIDER_HEIGHT,
    backgroundColor: Colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalVolumeFill: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  hint: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
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
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: SCREEN_WIDTH - 80,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  timerOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  timerOptionSelected: {
    backgroundColor: Colors.primary,
  },
  timerOptionText: {
    ...Typography.body,
    color: Colors.text,
    textAlign: 'center',
  },
  timerOptionTextSelected: {
    color: Colors.background,
    fontWeight: '600',
  },
  // Brightness Modal Styles
  brightnessModalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: SCREEN_WIDTH - 60,
  },
  brightnessSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  brightnessSliderWrapper: {
    flex: 1,
  },
  brightnessValue: {
    ...Typography.bodyMedium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  brightnessPresets: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  presetButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: Spacing.xs,
  },
  presetButtonActive: {
    backgroundColor: Colors.primary,
  },
  presetText: {
    ...Typography.small,
    color: Colors.text,
  },
  presetTextActive: {
    color: Colors.background,
    fontWeight: '600',
  },
});

export default PlayerScreen;
