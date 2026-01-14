import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, SLEEP_TIMER_OPTIONS } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SleepTimerModalProps {
  visible: boolean;
  currentTimer: number | null;
  onSelect: (minutes: number | null) => void;
  onClose: () => void;
}

const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  visible,
  currentTimer,
  onSelect,
  onClose,
}) => {
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={styles.modalOverlay}
      activeOpacity={1}
      onPress={onClose}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>수면 타이머</Text>
        {[...SLEEP_TIMER_OPTIONS, null].map((option) => (
          <TouchableOpacity
            key={option ?? 'off'}
            style={[
              styles.timerOption,
              currentTimer === option && styles.timerOptionSelected,
            ]}
            onPress={() => onSelect(option)}
          >
            <Text
              style={[
                styles.timerOptionText,
                currentTimer === option && styles.timerOptionTextSelected,
              ]}
            >
              {option === null ? '끄기' : `${option}분`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
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
});

export default SleepTimerModal;
