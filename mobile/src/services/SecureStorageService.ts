/**
 * SecureStorageService - 민감 데이터 보안 저장소
 *
 * 현재: AsyncStorage 기반 (개발/프로토타입용)
 * 프로덕션: react-native-keychain 또는 expo-secure-store로 교체 필요
 *
 * 보안 권장사항:
 * 1. npm install react-native-keychain
 * 2. 이 파일의 구현을 keychain 기반으로 교체
 * 3. 기존 AsyncStorage 데이터 마이그레이션
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ErrorLogger } from './ErrorLogger';

const logger = ErrorLogger.forScreen('SecureStorageService');

// 보안 저장소 키 접두사 (향후 마이그레이션 식별용)
const SECURE_PREFIX = '@heeling_secure_';

// 저장 가능한 민감 데이터 키 타입
export type SecureStorageKey =
  | 'auth_token'
  | 'refresh_token'
  | 'user_credentials'
  | 'encryption_key';

/**
 * SecureStorageService
 *
 * 민감한 데이터를 안전하게 저장하기 위한 추상화 레이어
 * 현재는 AsyncStorage를 사용하지만, 프로덕션에서는
 * react-native-keychain으로 교체해야 합니다.
 */
class SecureStorageServiceImpl {
  private static instance: SecureStorageServiceImpl;

  private constructor() {}

  static getInstance(): SecureStorageServiceImpl {
    if (!SecureStorageServiceImpl.instance) {
      SecureStorageServiceImpl.instance = new SecureStorageServiceImpl();
    }
    return SecureStorageServiceImpl.instance;
  }

  /**
   * 민감 데이터 저장
   */
  async setItem(key: SecureStorageKey, value: string): Promise<void> {
    try {
      const storageKey = `${SECURE_PREFIX}${key}`;

      // TODO: 프로덕션에서는 react-native-keychain 사용
      // await Keychain.setGenericPassword(key, value, { service: storageKey });

      // 현재: AsyncStorage (개발용)
      await AsyncStorage.setItem(storageKey, value);

      logger.debug('setItem', 'Secure data stored', { key });
    } catch (error) {
      logger.error('setItem', 'Failed to store secure data', error as Error, { key });
      throw error;
    }
  }

  /**
   * 민감 데이터 조회
   */
  async getItem(key: SecureStorageKey): Promise<string | null> {
    try {
      const storageKey = `${SECURE_PREFIX}${key}`;

      // TODO: 프로덕션에서는 react-native-keychain 사용
      // const credentials = await Keychain.getGenericPassword({ service: storageKey });
      // return credentials ? credentials.password : null;

      // 현재: AsyncStorage (개발용)
      const value = await AsyncStorage.getItem(storageKey);

      logger.debug('getItem', 'Secure data retrieved', { key, found: !!value });
      return value;
    } catch (error) {
      logger.error('getItem', 'Failed to retrieve secure data', error as Error, { key });
      return null;
    }
  }

  /**
   * 민감 데이터 삭제
   */
  async removeItem(key: SecureStorageKey): Promise<void> {
    try {
      const storageKey = `${SECURE_PREFIX}${key}`;

      // TODO: 프로덕션에서는 react-native-keychain 사용
      // await Keychain.resetGenericPassword({ service: storageKey });

      // 현재: AsyncStorage (개발용)
      await AsyncStorage.removeItem(storageKey);

      logger.debug('removeItem', 'Secure data removed', { key });
    } catch (error) {
      logger.error('removeItem', 'Failed to remove secure data', error as Error, { key });
      throw error;
    }
  }

  /**
   * 모든 민감 데이터 삭제 (로그아웃 시)
   */
  async clearAll(): Promise<void> {
    try {
      const keys: SecureStorageKey[] = [
        'auth_token',
        'refresh_token',
        'user_credentials',
        'encryption_key',
      ];

      await Promise.all(keys.map(key => this.removeItem(key)));

      logger.info('clearAll', 'All secure data cleared');
    } catch (error) {
      logger.error('clearAll', 'Failed to clear all secure data', error as Error);
      throw error;
    }
  }

  /**
   * 보안 저장소 사용 가능 여부 확인
   */
  async isAvailable(): Promise<boolean> {
    try {
      // TODO: 프로덕션에서는 keychain 지원 여부 확인
      // const supported = await Keychain.getSupportedBiometryType();
      // return supported !== null;

      // 현재: AsyncStorage는 항상 사용 가능
      return true;
    } catch (error) {
      logger.warn('isAvailable', 'Secure storage availability check failed', { error });
      return false;
    }
  }

  /**
   * 생체 인증으로 보호된 데이터 저장 (향후 구현)
   */
  async setItemWithBiometrics(
    key: SecureStorageKey,
    value: string,
    _options?: { prompt?: string }
  ): Promise<void> {
    // TODO: 프로덕션에서는 생체 인증 지원
    // await Keychain.setGenericPassword(key, value, {
    //   service: `${SECURE_PREFIX}${key}`,
    //   accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    //   accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    // });

    // 현재: 일반 저장과 동일
    await this.setItem(key, value);
  }

  /**
   * 생체 인증으로 보호된 데이터 조회 (향후 구현)
   */
  async getItemWithBiometrics(
    key: SecureStorageKey,
    _options?: { prompt?: string }
  ): Promise<string | null> {
    // TODO: 프로덕션에서는 생체 인증 요청
    // const credentials = await Keychain.getGenericPassword({
    //   service: `${SECURE_PREFIX}${key}`,
    //   authenticationPrompt: { title: options?.prompt || '인증이 필요합니다' },
    // });
    // return credentials ? credentials.password : null;

    // 현재: 일반 조회와 동일
    return this.getItem(key);
  }
}

export const SecureStorageService = SecureStorageServiceImpl.getInstance();
export default SecureStorageService;
