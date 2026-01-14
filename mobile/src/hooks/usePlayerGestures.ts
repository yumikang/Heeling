import { useCallback, useRef } from 'react';
import { useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture } from 'react-native-gesture-handler';

interface UsePlayerGesturesProps {
  isImmersiveMode: boolean;
  isClockMode: boolean;
  toggleImmersiveMode: () => void;
  setIsClockMode: (value: boolean) => void;
  onGoBack: () => void;
}

interface UsePlayerGesturesReturn {
  translateY: { value: number };
  modeIndicatorOpacity: { value: number };
  panGesture: ReturnType<typeof Gesture.Pan>;
  doubleTap: ReturnType<typeof Gesture.Tap>;
  longPress: ReturnType<typeof Gesture.LongPress>;
}

export const usePlayerGestures = ({
  isImmersiveMode,
  isClockMode,
  toggleImmersiveMode,
  setIsClockMode,
  onGoBack,
}: UsePlayerGesturesProps): UsePlayerGesturesReturn => {
  const translateY = useSharedValue(0);
  const modeIndicatorOpacity = useSharedValue(0);
  const modeIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showModeIndicator = useCallback(() => {
    modeIndicatorOpacity.value = withTiming(1, { duration: 200 });

    if (modeIndicatorTimer.current) {
      clearTimeout(modeIndicatorTimer.current);
    }

    modeIndicatorTimer.current = setTimeout(() => {
      modeIndicatorOpacity.value = withTiming(0, { duration: 300 });
    }, 2000);
  }, [modeIndicatorOpacity]);

  const handleDoubleTap = useCallback(() => {
    if (!isImmersiveMode) {
      toggleImmersiveMode();
      showModeIndicator();
    } else if (!isClockMode) {
      setIsClockMode(true);
      showModeIndicator();
    } else {
      setIsClockMode(false);
      showModeIndicator();
    }
  }, [isImmersiveMode, isClockMode, toggleImmersiveMode, setIsClockMode, showModeIndicator]);

  const handleLongPress = useCallback(() => {
    if (isImmersiveMode || isClockMode) {
      setIsClockMode(false);
      if (isImmersiveMode) {
        toggleImmersiveMode();
      }
      showModeIndicator();
    }
  }, [isImmersiveMode, isClockMode, toggleImmersiveMode, setIsClockMode, showModeIndicator]);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        runOnJS(onGoBack)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      runOnJS(handleDoubleTap)();
    });

  const longPress = Gesture.LongPress()
    .minDuration(500)
    .onEnd(() => {
      runOnJS(handleLongPress)();
    });

  return {
    translateY,
    modeIndicatorOpacity,
    panGesture,
    doubleTap,
    longPress,
  };
};

export default usePlayerGestures;
