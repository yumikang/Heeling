import React, { useCallback } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
  useDerivedValue,
} from 'react-native-reanimated';
import { Colors, BorderRadius } from '../../constants';

interface CustomSliderProps {
  min?: number;
  max?: number;
  value: number;
  onValueChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  trackColor?: string;
  fillColor?: string;
  thumbColor?: string;
  thumbSize?: number;
  trackHeight?: number;
  disabled?: boolean;
}

const CustomSlider: React.FC<CustomSliderProps> = ({
  min = 0,
  max = 100,
  value,
  onValueChange,
  onSlidingComplete,
  trackColor = Colors.surface,
  fillColor = Colors.primary,
  thumbColor = Colors.text,
  thumbSize = 16,
  trackHeight = 4,
  disabled = false,
}) => {
  const sliderWidth = useSharedValue(0);
  const thumbX = useSharedValue(0);
  const isSliding = useSharedValue(false);

  // Calculate thumb position from value
  const getPositionFromValue = useCallback((val: number): number => {
    'worklet';
    const percentage = (val - min) / (max - min);
    return percentage * sliderWidth.value;
  }, [min, max]);

  // Calculate value from thumb position (worklet version for gesture handlers)
  const getValueFromPosition = (position: number, width: number): number => {
    'worklet';
    const percentage = Math.max(0, Math.min(1, position / width));
    return min + percentage * (max - min);
  };

  // Update thumb position when value changes externally
  React.useEffect(() => {
    // Don't use .value in React render context
    thumbX.value = getPositionFromValue(value);
  }, [value, getPositionFromValue]);

  const handleLayout = (event: LayoutChangeEvent) => {
    sliderWidth.value = event.nativeEvent.layout.width;
    thumbX.value = getPositionFromValue(value);
  };

  const updateValue = useCallback((val: number) => {
    onValueChange?.(val);
  }, [onValueChange]);

  const completeSliding = useCallback((val: number) => {
    onSlidingComplete?.(val);
  }, [onSlidingComplete]);

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onBegin((event) => {
      'worklet';
      isSliding.value = true;
      thumbX.value = Math.max(0, Math.min(event.x, sliderWidth.value));
      const newValue = getValueFromPosition(thumbX.value, sliderWidth.value);
      runOnJS(updateValue)(newValue);
    })
    .onUpdate((event) => {
      'worklet';
      thumbX.value = Math.max(0, Math.min(event.x, sliderWidth.value));
      const newValue = getValueFromPosition(thumbX.value, sliderWidth.value);
      runOnJS(updateValue)(newValue);
    })
    .onEnd(() => {
      'worklet';
      isSliding.value = false;
      const finalValue = getValueFromPosition(thumbX.value, sliderWidth.value);
      runOnJS(completeSliding)(finalValue);
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .onEnd((event) => {
      'worklet';
      const clampedX = Math.max(0, Math.min(event.x, sliderWidth.value));
      thumbX.value = withSpring(clampedX);
      const newValue = getValueFromPosition(clampedX, sliderWidth.value);
      runOnJS(updateValue)(newValue);
      runOnJS(completeSliding)(newValue);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value - thumbSize / 2 }],
  }));

  return (
    <GestureHandlerRootView style={styles.wrapper}>
      <GestureDetector gesture={composedGesture}>
        <View
          style={[styles.container, { height: thumbSize }]}
          onLayout={handleLayout}
        >
          {/* Track */}
          <View
            style={[
              styles.track,
              {
                backgroundColor: trackColor,
                height: trackHeight,
                borderRadius: trackHeight / 2,
              },
            ]}
          >
            {/* Fill */}
            <Animated.View
              style={[
                styles.fill,
                {
                  backgroundColor: fillColor,
                  height: trackHeight,
                  borderRadius: trackHeight / 2,
                },
                fillStyle,
              ]}
            />
          </View>

          {/* Thumb */}
          <Animated.View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                backgroundColor: thumbColor,
              },
              thumbStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '100%',
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  thumb: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default CustomSlider;
