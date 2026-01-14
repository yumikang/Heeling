import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

interface RadioOptionProps {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

export default function RadioOption({
  label,
  description,
  selected,
  onPress,
}: RadioOptionProps) {
  return (
    <TouchableOpacity
      style={[styles.radioOption, selected && styles.radioOptionSelected]}
      onPress={onPress}
    >
      <View style={styles.radioCircle}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <View style={styles.radioTextContainer}>
        <Text style={styles.radioLabel}>{label}</Text>
        <Text style={styles.radioDescription}>{description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  radioOptionSelected: {
    backgroundColor: Colors.surfaceLight,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    ...Typography.body,
    color: Colors.text,
  },
  radioDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
