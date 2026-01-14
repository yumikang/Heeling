import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing } from '../../constants';

interface SettingItemProps {
  icon: string;
  title: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function SettingItem({
  icon,
  title,
  onPress,
  rightComponent,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={22} color={Colors.textSecondary} />
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      {rightComponent || (onPress && (
        <Icon name="chevron-forward" size={20} color={Colors.textSecondary} />
      ))}
    </TouchableOpacity>
  );
}

interface SettingItemWithSwitchProps {
  icon: string;
  title: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function SettingItemWithSwitch({
  icon,
  title,
  value,
  onValueChange,
}: SettingItemWithSwitchProps) {
  return (
    <SettingItem
      icon={icon}
      title={title}
      rightComponent={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: Colors.surfaceLight, true: Colors.primaryDark }}
          thumbColor={'#FFFFFF'}
          ios_backgroundColor={Colors.surfaceLight}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingTitle: {
    ...Typography.body,
    color: Colors.text,
  },
});
