import { getFirstRow, runSql } from '../database';
import { UserType, Occupation, BusinessType } from '../types';

// Keys for app_metadata table
const KEYS = {
  USER_TYPE: 'onboarding_user_type',
  OCCUPATION: 'onboarding_occupation',
  BUSINESS_TYPE: 'onboarding_business_type',
  COMPLETED: 'onboarding_completed',
};

export interface OnboardingData {
  userType: UserType | null;
  occupation: Occupation | null;
  businessType: BusinessType | null;
  completed: boolean;
}

export const OnboardingService = {
  /**
   * Save onboarding data to SQLite
   */
  async saveOnboardingData(data: Partial<OnboardingData>): Promise<void> {
    try {
      if (data.userType !== undefined) {
        await this.setMetadata(KEYS.USER_TYPE, data.userType);
      }
      if (data.occupation !== undefined) {
        await this.setMetadata(KEYS.OCCUPATION, data.occupation);
      }
      if (data.businessType !== undefined) {
        await this.setMetadata(KEYS.BUSINESS_TYPE, data.businessType);
      }
      if (data.completed !== undefined) {
        await this.setMetadata(KEYS.COMPLETED, data.completed ? 'true' : 'false');
      }
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      throw error;
    }
  },

  /**
   * Load onboarding data from SQLite
   */
  async loadOnboardingData(): Promise<OnboardingData> {
    try {
      const [userType, occupation, businessType, completed] = await Promise.all([
        this.getMetadata(KEYS.USER_TYPE),
        this.getMetadata(KEYS.OCCUPATION),
        this.getMetadata(KEYS.BUSINESS_TYPE),
        this.getMetadata(KEYS.COMPLETED),
      ]);

      return {
        userType: userType as UserType | null,
        occupation: occupation as Occupation | null,
        businessType: businessType as BusinessType | null,
        completed: completed === 'true',
      };
    } catch (error) {
      console.error('Failed to load onboarding data:', error);
      // Return default values on error
      return {
        userType: null,
        occupation: null,
        businessType: null,
        completed: false,
      };
    }
  },

  /**
   * Check if onboarding is completed
   */
  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await this.getMetadata(KEYS.COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      return false;
    }
  },

  /**
   * Mark onboarding as completed
   */
  async completeOnboarding(): Promise<void> {
    await this.setMetadata(KEYS.COMPLETED, 'true');
  },

  /**
   * Reset onboarding data (for debugging or user request)
   */
  async resetOnboarding(): Promise<void> {
    try {
      await Promise.all([
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.USER_TYPE]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.OCCUPATION]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.BUSINESS_TYPE]),
        runSql('DELETE FROM app_metadata WHERE key = ?', [KEYS.COMPLETED]),
      ]);
    } catch (error) {
      console.error('Failed to reset onboarding:', error);
      throw error;
    }
  },

  /**
   * Helper: Get metadata value by key
   */
  async getMetadata(key: string): Promise<string | null> {
    const row = await getFirstRow<{ value: string }>(
      'SELECT value FROM app_metadata WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  },

  /**
   * Helper: Set metadata value (insert or update)
   */
  async setMetadata(key: string, value: string | null): Promise<void> {
    if (value === null) {
      await runSql('DELETE FROM app_metadata WHERE key = ?', [key]);
    } else {
      await runSql(
        `INSERT INTO app_metadata (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')`,
        [key, value, value]
      );
    }
  },
};

export default OnboardingService;
