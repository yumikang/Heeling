import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserType, Occupation, BusinessType } from '../types';

interface UserState {
  // User Type
  userType: UserType | null;

  // Personal User Fields
  occupation: Occupation | null;

  // Business User Fields
  businessType: BusinessType | null;

  // Onboarding
  onboardingCompleted: boolean;

  // Actions
  setUserType: (type: UserType) => void;
  setOccupation: (occupation: Occupation) => void;
  setBusinessType: (businessType: BusinessType) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  syncFromSQLite: (data: {
    userType: UserType | null;
    occupation: Occupation | null;
    businessType: BusinessType | null;
    completed: boolean;
  }) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userType: null,
      occupation: null,
      businessType: null,
      onboardingCompleted: false,

      setUserType: (type: UserType) => set({
        userType: type,
        // Reset type-specific fields when changing user type
        occupation: null,
        businessType: null,
      }),

      setOccupation: (occupation: Occupation) => set({ occupation }),

      setBusinessType: (businessType: BusinessType) => set({ businessType }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      resetOnboarding: () => set({
        userType: null,
        occupation: null,
        businessType: null,
        onboardingCompleted: false,
      }),

      syncFromSQLite: (data) => set({
        userType: data.userType,
        occupation: data.occupation,
        businessType: data.businessType,
        onboardingCompleted: data.completed,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
