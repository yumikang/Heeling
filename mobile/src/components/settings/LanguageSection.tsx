import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { LanguageCode, LanguageOption, LANGUAGE_OPTIONS } from '../../hooks/useSettings';

interface LanguageSectionProps {
  currentLanguage: LanguageCode;
  getCurrentLanguageOption: () => LanguageOption;
  modalVisible: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onLanguageChange: (langCode: LanguageCode) => void;
}

export default function LanguageSection({
  currentLanguage,
  getCurrentLanguageOption,
  modalVisible,
  onOpenModal,
  onCloseModal,
  onLanguageChange,
}: LanguageSectionProps) {
  const currentOption = getCurrentLanguageOption();

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {currentOption.flag} {currentOption.label}
        </Text>
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={onOpenModal}
            activeOpacity={0.7}
          >
            <View style={styles.settingLeft}>
              <Icon name="language-outline" size={22} color={Colors.textSecondary} />
              <Text style={styles.settingTitle}>{currentOption.label}</Text>
            </View>
            <View style={styles.languageValueContainer}>
              <Text style={styles.languageValue}>{currentOption.nativeName}</Text>
              <Icon name="chevron-forward" size={20} color={Colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={onCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={onCloseModal}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {currentOption.flag} {currentOption.label}
            </Text>

            {LANGUAGE_OPTIONS.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionSelected,
                ]}
                onPress={() => onLanguageChange(lang.code)}
                activeOpacity={0.7}
              >
                <View style={styles.languageOptionLeft}>
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={styles.languageOptionText}>{lang.nativeName}</Text>
                </View>
                {currentLanguage === lang.code && (
                  <Icon name="checkmark-circle" size={24} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.modalCancelButton} onPress={onCloseModal}>
              <Text style={styles.modalCancelText}>취소</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  languageValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  languageValue: {
    ...Typography.body,
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  languageOptionSelected: {
    backgroundColor: Colors.surfaceLight,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageOptionText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  modalCancelButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  modalCancelText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },
});
