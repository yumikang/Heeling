import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { NetworkMode, StreamingQuality } from '../../types';
import { SettingItemWithSwitch } from './SettingItem';
import RadioOption from './RadioOption';
import QualitySelector from './QualitySelector';

interface NetworkSectionProps {
  networkMode: NetworkMode;
  streamingQuality: StreamingQuality;
  allowCellularDownload: boolean;
  onNetworkModeChange: (mode: NetworkMode) => void;
  onQualityChange: (quality: StreamingQuality) => void;
  onCellularDownloadChange: (value: boolean) => void;
}

const NETWORK_MODE_OPTIONS = [
  { mode: 'wifi_only' as NetworkMode, label: 'Wi-Fi 전용', description: 'Wi-Fi에서만 스트리밍/다운로드' },
  { mode: 'streaming' as NetworkMode, label: '스트리밍', description: '모든 네트워크에서 스트리밍 허용' },
  { mode: 'offline' as NetworkMode, label: '오프라인', description: '다운로드된 콘텐츠만 재생' },
];

export default function NetworkSection({
  networkMode,
  streamingQuality,
  allowCellularDownload,
  onNetworkModeChange,
  onQualityChange,
  onCellularDownloadChange,
}: NetworkSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>네트워크 설정</Text>
      <View style={styles.sectionContent}>
        {/* Network Mode Selection */}
        <View style={styles.settingGroup}>
          <View style={styles.settingGroupHeader}>
            <Icon name="wifi-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.settingGroupTitle}>연결 모드</Text>
          </View>
          {NETWORK_MODE_OPTIONS.map((option) => (
            <RadioOption
              key={option.mode}
              label={option.label}
              description={option.description}
              selected={networkMode === option.mode}
              onPress={() => onNetworkModeChange(option.mode)}
            />
          ))}
        </View>

        {/* Streaming Quality */}
        <View style={styles.settingGroup}>
          <View style={styles.settingGroupHeader}>
            <Icon name="speedometer-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.settingGroupTitle}>스트리밍 품질</Text>
          </View>
          <QualitySelector
            value={streamingQuality}
            onValueChange={onQualityChange}
          />
        </View>

        {/* Cellular Download Toggle */}
        <SettingItemWithSwitch
          icon="cellular-outline"
          title="셀룰러 다운로드 허용"
          value={allowCellularDownload}
          onValueChange={onCellularDownloadChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.captionMedium,
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  settingGroup: {
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  settingGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  settingGroupTitle: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
});
