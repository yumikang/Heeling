import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList, UserType, Occupation, BusinessType } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';
import { useUserStore } from '../../stores';
import { Button } from '../../components';
import { OnboardingService } from '../../services';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const USER_TYPES = [
  { id: 'personal', title: '개인용', subtitle: '집중, 수면, 명상을 위해', icon: 'person' },
  { id: 'business', title: '비즈니스', subtitle: '카페, 매장 BGM으로', icon: 'storefront' },
];

const OCCUPATIONS = [
  { id: 'developer', title: '개발자', icon: 'code-slash' },
  { id: 'designer', title: '디자이너', icon: 'color-palette' },
  { id: 'student', title: '학생', icon: 'school' },
  { id: 'other', title: '기타', icon: 'ellipsis-horizontal' },
];

const BUSINESS_TYPES = [
  { id: 'cafe', title: '카페', icon: 'cafe' },
  { id: 'spa', title: '스파', icon: 'water' },
  { id: 'yoga', title: '요가', icon: 'fitness' },
  { id: 'salon', title: '미용실', icon: 'cut' },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    setUserType,
    setOccupation,
    setBusinessType,
    completeOnboarding,
  } = useUserStore();

  const [step, setStep] = useState(1);
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(null);
  const [selectedOccupation, setSelectedOccupation] = useState<Occupation | null>(null);
  const [selectedBusinessType, setSelectedBusinessType] = useState<BusinessType | null>(null);

  const handleUserTypeSelect = (type: UserType) => {
    setSelectedUserType(type);
    setUserType(type);
  };

  const handleNext = () => {
    if (step === 1 && selectedUserType) {
      setStep(2);
    }
  };

  const handleComplete = async () => {
    if (selectedUserType === 'personal' && selectedOccupation) {
      setOccupation(selectedOccupation);
    } else if (selectedUserType === 'business' && selectedBusinessType) {
      setBusinessType(selectedBusinessType);
    }
    completeOnboarding();

    // SQLite에 온보딩 데이터 저장
    try {
      await OnboardingService.saveOnboardingData({
        userType: selectedUserType,
        occupation: selectedUserType === 'personal' ? selectedOccupation : null,
        businessType: selectedUserType === 'business' ? selectedBusinessType : null,
        completed: true,
      });
    } catch (error) {
      console.error('Failed to save onboarding to SQLite:', error);
    }

    navigation.replace('MainTabs');
  };

  const canProceed = step === 1
    ? selectedUserType !== null
    : selectedUserType === 'personal'
      ? selectedOccupation !== null
      : selectedBusinessType !== null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progress}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>

        {/* Step 1: User Type */}
        {step === 1 && (
          <>
            <Text style={styles.title}>어떤 목적으로 사용하시나요?</Text>
            <Text style={styles.subtitle}>
              맞춤 콘텐츠를 추천해 드릴게요
            </Text>

            <View style={styles.optionsContainer}>
              {USER_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.optionCard,
                    selectedUserType === type.id && styles.optionCardSelected,
                  ]}
                  onPress={() => handleUserTypeSelect(type.id as UserType)}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={type.icon as any}
                    size={32}
                    color={selectedUserType === type.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[
                    styles.optionTitle,
                    selectedUserType === type.id && styles.optionTitleSelected,
                  ]}>
                    {type.title}
                  </Text>
                  <Text style={styles.optionSubtitle}>{type.subtitle}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <>
            <Text style={styles.title}>
              {selectedUserType === 'personal'
                ? '직업을 알려주세요'
                : '업종을 선택해주세요'}
            </Text>
            <Text style={styles.subtitle}>
              더 나은 추천을 위해 사용됩니다
            </Text>

            <View style={styles.gridContainer}>
              {(selectedUserType === 'personal' ? OCCUPATIONS : BUSINESS_TYPES).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridItem,
                    (selectedUserType === 'personal'
                      ? selectedOccupation === item.id
                      : selectedBusinessType === item.id) && styles.gridItemSelected,
                  ]}
                  onPress={() => {
                    if (selectedUserType === 'personal') {
                      setSelectedOccupation(item.id as Occupation);
                    } else {
                      setSelectedBusinessType(item.id as BusinessType);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Icon
                    name={item.icon as any}
                    size={28}
                    color={
                      (selectedUserType === 'personal'
                        ? selectedOccupation === item.id
                        : selectedBusinessType === item.id)
                        ? Colors.primary
                        : Colors.textSecondary
                    }
                  />
                  <Text style={[
                    styles.gridItemText,
                    (selectedUserType === 'personal'
                      ? selectedOccupation === item.id
                      : selectedBusinessType === item.id) && styles.gridItemTextSelected,
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={step === 1 ? '다음' : '시작하기'}
            onPress={step === 1 ? handleNext : handleComplete}
            disabled={!canProceed}
            fullWidth
            size="large"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.surface,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xs,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  title: {
    ...Typography.heading2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  optionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  optionTitle: {
    ...Typography.heading3,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  optionTitleSelected: {
    color: Colors.primary,
  },
  optionSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  gridItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceLight,
  },
  gridItemText: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  gridItemTextSelected: {
    color: Colors.primary,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
});

export default OnboardingScreen;
