import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PopupData, PopupButton } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FullscreenPopupProps {
  visible: boolean;
  popup: PopupData;
  onClose: () => void;
  onButtonPress: (button: PopupButton) => void;
}

export const FullscreenPopup: React.FC<FullscreenPopupProps> = ({
  visible,
  popup,
  onClose,
  onButtonPress,
}) => {
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!visible) {
      setShowCloseButton(false);
      setCountdown(null);
      return;
    }

    const delay = popup.fullscreenOptions?.closeButtonDelay ?? 0;

    if (delay > 0) {
      setCountdown(delay);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setShowCloseButton(true);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setShowCloseButton(popup.fullscreenOptions?.showCloseButton ?? true);
    }
  }, [visible, popup]);

  // 자동 닫힘
  useEffect(() => {
    if (!visible) return;

    const autoClose = popup.fullscreenOptions?.autoCloseDelay;
    if (autoClose && autoClose > 0) {
      const timeout = setTimeout(() => {
        onClose();
      }, autoClose * 1000);

      return () => clearTimeout(timeout);
    }
  }, [visible, popup, onClose]);

  const handleButtonPress = async (button: PopupButton) => {
    if (button.action === 'link' && button.value) {
      await Linking.openURL(button.value);
    }
    onButtonPress(button);
  };

  const renderButton = (button: PopupButton) => {
    const isPrimary = button.style === 'primary';
    const isText = button.style === 'text';

    return (
      <TouchableOpacity
        key={button.id}
        style={[
          styles.button,
          isPrimary && styles.primaryButton,
          isText && styles.textButton,
        ]}
        onPress={() => handleButtonPress(button)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.buttonText,
            isPrimary && styles.primaryButtonText,
            isText && styles.textButtonText,
          ]}
        >
          {button.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={popup.dismissible ? onClose : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View
        style={[
          styles.container,
          popup.backgroundColor ? { backgroundColor: popup.backgroundColor } : null,
        ]}
      >
        {/* 닫기 버튼 */}
        {(showCloseButton || countdown !== null) && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={showCloseButton ? onClose : undefined}
            disabled={!showCloseButton}
            activeOpacity={0.7}
          >
            {countdown !== null ? (
              <View style={styles.countdownBadge}>
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            ) : (
              <Icon name="close" size={28} color={Colors.text} />
            )}
          </TouchableOpacity>
        )}

        {/* 이미지 */}
        {popup.imageUrl && (
          <Image
            source={{ uri: popup.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        )}

        {/* 콘텐츠 */}
        <View style={styles.content}>
          {popup.title && <Text style={styles.title}>{popup.title}</Text>}
          {popup.message && <Text style={styles.message}>{popup.message}</Text>}
        </View>

        {/* 버튼들 */}
        <View style={styles.buttonContainer}>
          {popup.buttons.map(renderButton)}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'space-between',
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: Spacing.xxl,
  },
  closeButton: {
    position: 'absolute',
    top: (StatusBar.currentHeight || 50) + Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.5,
    marginTop: Spacing.xxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    ...Typography.heading1,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  primaryButtonText: {
    color: Colors.background,
  },
  textButtonText: {
    color: Colors.textSecondary,
  },
});

export default FullscreenPopup;
