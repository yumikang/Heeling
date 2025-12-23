import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius, API_BASE_URL } from '../../constants';
import { Button } from '../../components';
import {
  IAPService,
  useIAPService,
  PRODUCT_IDS,
  SUBSCRIPTION_SKUS,
  type IAPSubscription,
  type PurchaseResult,
  type PurchaseError,
} from '../../services/IAPService';
import { useAuthStore } from '../../stores';

interface PremiumConfig {
  yearlyPrice: string;
  yearlyDescription: string;
  monthlyPrice: string;
  monthlyDescription: string;
  trialDays: string;
  trialEnabled: boolean;
}

const DEFAULT_CONFIG: PremiumConfig = {
  yearlyPrice: '59900',
  yearlyDescription: '월 ₩4,992 (50% 할인)',
  monthlyPrice: '9900',
  monthlyDescription: '언제든 해지 가능',
  trialDays: '7',
  trialEnabled: true,
};

const FEATURES = [
  { icon: 'musical-notes', title: '모든 트랙 무제한 재생' },
  { icon: 'cloud-download', title: '오프라인 다운로드' },
  { icon: 'volume-high', title: '고품질 오디오' },
  { icon: 'moon', title: '고급 수면 기능' },
  { icon: 'ban', title: '광고 없는 경험' },
];

const PremiumScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, login } = useAuthStore();

  const [config, setConfig] = useState<PremiumConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  // 스텁 IAP 서비스 사용
  const {
    connected,
    subscriptions,
    formatPrice,
  } = useIAPService();

  // IAP 초기화 및 상품 로드
  useEffect(() => {
    fetchPremiumConfig();
  }, []);

  const fetchPremiumConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/config/premium`);
      const data = await response.json();

      if (data.success && data.data) {
        setConfig({
          yearlyPrice: data.data.yearlyPrice || DEFAULT_CONFIG.yearlyPrice,
          yearlyDescription: data.data.yearlyDescription || DEFAULT_CONFIG.yearlyDescription,
          monthlyPrice: data.data.monthlyPrice || DEFAULT_CONFIG.monthlyPrice,
          monthlyDescription: data.data.monthlyDescription || DEFAULT_CONFIG.monthlyDescription,
          trialDays: data.data.trialDays || DEFAULT_CONFIG.trialDays,
          trialEnabled: data.data.trialEnabled !== undefined ? data.data.trialEnabled : DEFAULT_CONFIG.trialEnabled,
        });
      }
    } catch (error) {
      console.log('Failed to fetch premium config, using defaults:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPriceKRW = (price: string) => {
    const num = parseInt(price, 10);
    return num.toLocaleString('ko-KR');
  };

  // 스토어 가격 가져오기 (있으면 스토어 가격, 없으면 서버 설정 가격)
  const getDisplayPrice = (plan: 'monthly' | 'yearly'): string => {
    const sku = plan === 'monthly'
      ? PRODUCT_IDS.SUBSCRIPTION_MONTHLY
      : PRODUCT_IDS.SUBSCRIPTION_YEARLY;

    const subscription = subscriptions.find(s => s.productId === sku);

    if (subscription) {
      return formatPrice(subscription);
    }

    // 스토어 가격을 못 가져온 경우 서버 설정 가격 사용
    const price = plan === 'monthly' ? config.monthlyPrice : config.yearlyPrice;
    return `₩${formatPriceKRW(price)}`;
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSubscribe = async () => {
    setIsPurchasing(true);

    try {
      const sku = selectedPlan === 'monthly'
        ? PRODUCT_IDS.SUBSCRIPTION_MONTHLY
        : PRODUCT_IDS.SUBSCRIPTION_YEARLY;

      // 해당 구독 상품 찾기
      const subscription = subscriptions.find(s => s.productId === sku);

      await IAPService.purchaseSubscription(sku, subscription);
    } catch (error: any) {
      setIsPurchasing(false);

      if (error.message === 'CANCELLED') {
        // 사용자 취소 - 무시
        return;
      }

      if (error.message === 'IAP_NOT_AVAILABLE') {
        Alert.alert('알림', '인앱 결제 기능이 아직 준비 중입니다. 곧 이용 가능합니다.');
        return;
      }

      Alert.alert('오류', '구매 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      const purchases = await IAPService.restorePurchases();

      if (purchases.length > 0) {
        // 프리미엄 상태 확인 및 업데이트
        const isPremium = await IAPService.checkPremiumStatus();

        if (isPremium && user) {
          login({ ...user, isPremium: true });
          Alert.alert(
            '복원 완료',
            '이전 구독이 복원되었습니다.',
            [{ text: '확인', onPress: () => navigation.goBack() }]
          );
        } else {
          Alert.alert('복원 실패', '복원할 구독 내역이 없습니다.');
        }
      } else {
        Alert.alert('복원 실패', '복원할 구독 내역이 없습니다.');
      }
    } catch (error) {
      console.error('Restore failed:', error);
      Alert.alert('오류', '복원 처리 중 오류가 발생했습니다.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Icon name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content */}
        <View style={styles.content}>
          {/* Badge */}
          <View style={styles.badge}>
            <Icon name="diamond" size={32} color={Colors.accent} />
          </View>

          <Text style={styles.title}>BRIBI Premium</Text>
          <Text style={styles.subtitle}>
            더 깊은 휴식을 위한 프리미엄 경험
          </Text>

          {/* Features */}
          <View style={styles.features}>
            {FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Icon name={feature.icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={styles.featureText}>{feature.title}</Text>
              </View>
            ))}
          </View>

          {/* Plans */}
          <View style={styles.plans}>
            {/* Yearly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.8}
            >
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>추천</Text>
              </View>
              <Text style={styles.planName}>연간 구독</Text>
              <Text style={styles.planPrice}>{getDisplayPrice('yearly')}/년</Text>
              <Text style={styles.planSaving}>{config.yearlyDescription}</Text>
              {selectedPlan === 'yearly' && (
                <View style={styles.checkmark}>
                  <Icon name="checkmark-circle" size={24} color={Colors.accent} />
                </View>
              )}
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.8}
            >
              <Text style={styles.planName}>월간 구독</Text>
              <Text style={styles.planPrice}>{getDisplayPrice('monthly')}/월</Text>
              <Text style={styles.planSaving}>{config.monthlyDescription}</Text>
              {selectedPlan === 'monthly' && (
                <View style={styles.checkmark}>
                  <Icon name="checkmark-circle" size={24} color={Colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* CTA */}
          <Button
            title={isPurchasing ? "처리 중..." : (config.trialEnabled ? "무료 체험 시작하기" : "프리미엄 구독하기")}
            onPress={handleSubscribe}
            fullWidth
            size="large"
            disabled={isPurchasing}
            loading={isPurchasing}
          />

          {/* Restore */}
          <TouchableOpacity
            onPress={handleRestore}
            style={styles.restoreButton}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.restoreText}>이전 구독 복원하기</Text>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.terms}>
            {config.trialEnabled
              ? `${config.trialDays}일 무료 체험 후 자동으로 결제됩니다.\n언제든 취소할 수 있습니다.`
              : '구독 결제 후 바로 이용 가능합니다.\n언제든 취소할 수 있습니다.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  badge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  features: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.text,
  },
  plans: {
    width: '100%',
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.accent,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  recommendedText: {
    ...Typography.small,
    color: Colors.text,
    fontWeight: '600',
  },
  planName: {
    ...Typography.bodyMedium,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  planPrice: {
    ...Typography.heading3,
    color: Colors.primary,
    marginTop: Spacing.xs,
  },
  planSaving: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkmark: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreText: {
    ...Typography.body,
    color: Colors.primary,
  },
  terms: {
    ...Typography.small,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
});

export default PremiumScreen;
