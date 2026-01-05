import React, { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FullscreenPopup } from './FullscreenPopup';
import { ModalPopup } from './ModalPopup';
import { PopupService } from '../../services/PopupService';
import { PopupData, PopupButton, RootStackParamList, UserType } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface PopupManagerProps {
  userType: UserType | null;
  isPremium?: boolean;
  enabled?: boolean;
}

export const PopupManager: React.FC<PopupManagerProps> = ({
  userType,
  isPremium = false,
  enabled = true,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const [popupQueue, setPopupQueue] = useState<PopupData[]>([]);
  const [currentPopup, setCurrentPopup] = useState<PopupData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // 큐 진행 (onDismiss에서 호출)
  const advanceQueue = useCallback(() => {
    setPopupQueue((prev) => prev.slice(1));
    setCurrentPopup(null);
    setIsClosing(false);
  }, []);

  // 팝업 로드
  useEffect(() => {
    if (!enabled) return;

    const loadPopups = async () => {
      console.log('[PopupManager] Loading popups...', { userType, isPremium });
      const popups = await PopupService.getActivePopups(userType, isPremium);
      console.log('[PopupManager] Loaded popups:', popups.length, popups);
      if (popups.length > 0) {
        setPopupQueue(popups);
      }
    };

    // 약간의 딜레이 후 팝업 로드 (앱 초기화 완료 후)
    const timeout = setTimeout(loadPopups, 1500);
    return () => clearTimeout(timeout);
  }, [enabled, userType, isPremium]);

  // 큐에서 다음 팝업 표시
  useEffect(() => {
    if (popupQueue.length > 0 && !currentPopup) {
      const nextPopup = popupQueue[0];
      setCurrentPopup(nextPopup);
      setIsVisible(true);
    }
  }, [popupQueue, currentPopup]);

  // 팝업 닫기 처리
  const handleClose = useCallback(async () => {
    if (currentPopup?.showOnce) {
      await PopupService.markPopupAsSeen(currentPopup.id);
    }
    setIsClosing(true);
    setIsVisible(false);
  }, [currentPopup]);

  // "다시 보지 않기" 처리
  const handleDontShowAgain = useCallback(async () => {
    if (currentPopup) {
      await PopupService.markPopupAsSeen(currentPopup.id);
    }
    setIsClosing(true);
    setIsVisible(false);
  }, [currentPopup]);

  // 버튼 액션 처리
  const handleButtonPress = useCallback(
    async (button: PopupButton) => {
      switch (button.action) {
        case 'screen':
          if (button.value) {
            // 화면 이동
            handleClose();
            setTimeout(() => {
              // @ts-ignore - 동적 화면 이동
              navigation.navigate(button.value);
            }, 300);
          }
          break;

        case 'deeplink':
          // 딥링크 처리 (추후 구현)
          console.log('Deeplink:', button.value);
          handleClose();
          break;

        case 'dismiss':
        case 'link':
        default:
          handleClose();
          break;
      }
    },
    [handleClose, navigation]
  );

  if (!currentPopup) {
    return null;
  }

  if (currentPopup.type === 'fullscreen') {
    return (
      <FullscreenPopup
        visible={isVisible}
        popup={currentPopup}
        onClose={handleClose}
        onButtonPress={handleButtonPress}
      />
    );
  }

  return (
    <ModalPopup
      visible={isVisible}
      popup={currentPopup}
      onClose={handleClose}
      onButtonPress={handleButtonPress}
      onDontShowAgain={handleDontShowAgain}
      onDismiss={() => {
        if (isClosing) advanceQueue();
      }}
    />
  );
};

export default PopupManager;
