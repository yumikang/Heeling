/**
 * IAPService - 인앱 결제 서비스 (스텁 버전)
 * react-native-iap 빌드 문제로 인해 임시 스텁 구현
 * TODO: react-native-iap 문제 해결 후 복구
 */

import { Platform } from 'react-native';

// 상품 ID (App Store Connect / Google Play Console에서 생성)
export const PRODUCT_IDS = {
  SUBSCRIPTION_MONTHLY: Platform.select({
    ios: 'com.heelingmobile.subscription.monthly',
    android: 'com.heelingmobile.subscription.monthly',
  }) as string,
  SUBSCRIPTION_YEARLY: Platform.select({
    ios: 'com.heelingmobile.subscription.yearly',
    android: 'com.heelingmobile.subscription.yearly',
  }) as string,
  PREMIUM_UNLOCK: Platform.select({
    ios: 'com.heelingmobile.premium.unlock',
    android: 'com.heelingmobile.premium.unlock',
  }) as string,
};

export const SUBSCRIPTION_SKUS = [
  PRODUCT_IDS.SUBSCRIPTION_MONTHLY,
  PRODUCT_IDS.SUBSCRIPTION_YEARLY,
];

export const PRODUCT_SKUS = [PRODUCT_IDS.PREMIUM_UNLOCK];

// 스텁 타입 정의
export type IAPProduct = {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  displayPrice?: string;
};

export type IAPSubscription = IAPProduct & {
  subscriptionPeriodNumberIOS?: number;
  subscriptionPeriodUnitIOS?: string;
};

export type PurchaseResult = {
  productId: string;
  transactionId?: string;
  transactionReceipt?: string;
};

export type PurchaseError = {
  code: string;
  message: string;
};

export const IAPService = {
  /**
   * IAP 연결 초기화 (스텁)
   */
  async initialize(): Promise<boolean> {
    console.log('[IAP Stub] Connection initialized');
    return true;
  },

  /**
   * IAP 연결 종료 (스텁)
   */
  async cleanup(): Promise<void> {
    console.log('[IAP Stub] Connection ended');
  },

  /**
   * 구매 리스너 설정 (스텁)
   */
  setupListeners(
    _onPurchaseUpdate: (purchase: PurchaseResult) => void,
    _onPurchaseError: (error: PurchaseError) => void
  ): void {
    console.log('[IAP Stub] Listeners setup');
  },

  /**
   * 구독 상품 구매 (스텁)
   */
  async purchaseSubscription(_sku: string, _subscription?: IAPSubscription): Promise<void> {
    console.log('[IAP Stub] Purchase subscription - not available');
    throw new Error('IAP_NOT_AVAILABLE');
  },

  /**
   * 일회성 상품 구매 (스텁)
   */
  async purchaseProduct(_sku: string): Promise<void> {
    console.log('[IAP Stub] Purchase product - not available');
    throw new Error('IAP_NOT_AVAILABLE');
  },

  /**
   * 이전 구매 복원 (스텁)
   */
  async restorePurchases(): Promise<PurchaseResult[]> {
    console.log('[IAP Stub] Restore purchases - returning empty');
    return [];
  },

  /**
   * 프리미엄 상태 확인 (스텁)
   */
  async checkPremiumStatus(): Promise<boolean> {
    console.log('[IAP Stub] Check premium status - returning false');
    return false;
  },

  /**
   * 가격 포맷팅
   */
  formatPrice(product: IAPProduct | IAPSubscription): string {
    if (product.displayPrice) {
      return product.displayPrice;
    }
    if (product.currency && product.price) {
      return `${product.currency} ${product.price}`;
    }
    return String(product.price || '');
  },

  /**
   * 구독 기간 설명
   */
  getSubscriptionPeriod(subscription: IAPSubscription): string {
    if (subscription.productId?.includes('monthly')) {
      return '월간';
    }
    if (subscription.productId?.includes('yearly')) {
      return '연간';
    }
    return '';
  },
};

/**
 * useIAPService - Hook 버전의 IAP 서비스 (스텁)
 */
export const useIAPService = () => {
  return {
    connected: false,
    products: [] as IAPProduct[],
    subscriptions: [] as IAPSubscription[],
    currentPurchase: undefined,
    currentPurchaseError: undefined,
    initConnectionError: undefined,
    getProducts: async () => [],
    getSubscriptions: async () => [],
    getAvailablePurchases: async () => [],
    requestPurchase: async () => {},
    // IAPService의 유틸리티 함수들
    formatPrice: IAPService.formatPrice,
    getSubscriptionPeriod: IAPService.getSubscriptionPeriod,
    PRODUCT_IDS,
    SUBSCRIPTION_SKUS,
    PRODUCT_SKUS,
  };
};

export default IAPService;
