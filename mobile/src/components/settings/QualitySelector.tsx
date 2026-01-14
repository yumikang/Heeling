import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { StreamingQuality } from '../../types';

interface QualitySelectorProps {
  value: StreamingQuality;
  onValueChange: (quality: StreamingQuality) => void;
}

const QUALITY_OPTIONS: { value: StreamingQuality; label: string }[] = [
  { value: 'auto', label: '자동' },
  { value: 'high', label: '고품질' },
  { value: 'low', label: '저품질' },
];

export default function QualitySelector({
  value,
  onValueChange,
}: QualitySelectorProps) {
  return (
    <View style={styles.qualitySelector}>
      {QUALITY_OPTIONS.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.qualityOption,
            value === option.value && styles.qualityOptionSelected,
          ]}
          onPress={() => onValueChange(option.value)}
        >
          <Text
            style={[
              styles.qualityText,
              value === option.value && styles.qualityTextSelected,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  qualitySelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.xs,
  },
  qualityOptionSelected: {
    backgroundColor: Colors.primary,
  },
  qualityText: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  qualityTextSelected: {
    color: Colors.text,
    fontWeight: '600',
  },
});
