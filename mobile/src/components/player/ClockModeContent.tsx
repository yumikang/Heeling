import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Spacing, BorderRadius } from '../../constants';

interface ClockModeContentProps {
  currentTime: Date;
  isPlaying: boolean;
  isTimerActive: boolean;
  formatRemainingTime: () => string;
}

const ClockModeContent: React.FC<ClockModeContentProps> = ({
  currentTime,
  isPlaying,
  isTimerActive,
  formatRemainingTime,
}) => {
  return (
    <View style={styles.clockContent}>
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

      {isTimerActive && (
        <View style={styles.clockTimerContainer}>
          <Icon name="moon" size={14} color={Colors.primary} />
          <Text style={styles.clockTimerText}>{formatRemainingTime()}</Text>
        </View>
      )}

      <View style={styles.clockPlayIndicator}>
        <Icon
          name={isPlaying ? 'musical-notes' : 'pause'}
          size={18}
          color="rgba(255, 255, 255, 0.4)"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
    color: '#5AC8FA',
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
    color: '#5AC8FA',
    letterSpacing: -12,
    includeFontPadding: false,
    textAlignVertical: 'center',
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
});

export default ClockModeContent;
