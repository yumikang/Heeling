import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { PopupData, PopupButton } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MODAL_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

interface ModalPopupProps {
  visible: boolean;
  popup: PopupData;
  onClose: () => void;
  onButtonPress: (button: PopupButton) => void;
  onDontShowAgain?: () => void;
}

export const ModalPopup: React.FC<ModalPopupProps> = ({
  visible,
  popup,
  onClose,
  onButtonPress,
  onDontShowAgain,
}) => {
  const handleButtonPress = async (button: PopupButton) => {
    if (button.action === 'link' && button.value) {
      await Linking.openURL(button.value);
    }
    onButtonPress(button);
  };

  const handleBackdropPress = () => {
    if (popup.dismissible) {
      onClose();
    }
  };

  const renderButton = (button: PopupButton, index: number) => {
    const isPrimary = button.style === 'primary';
    const isSecondary = button.style === 'secondary';
    const isText = button.style === 'text';
    const isLastButton = index === popup.buttons.length - 1;

    return (
      <TouchableOpacity
        key={button.id}
        style={[
          styles.button,
          isPrimary && styles.primaryButton,
          isSecondary && styles.secondaryButton,
          isText && styles.textButton,
          !isLastButton && styles.buttonMargin,
        ]}
        onPress={() => handleButtonPress(button)}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.buttonText,
            isPrimary && styles.primaryButtonText,
            isSecondary && styles.secondaryButtonText,
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
      transparent
      statusBarTranslucent
      onRequestClose={popup.dismissible ? onClose : undefined}
    >
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* 닫기 버튼 */}
              {popup.dismissible && (
                <View style={styles.closeButtonContainer}>
                  {popup.showDontShowAgain && onDontShowAgain && (
                    <Text style={styles.dontShowAgainLabel}>다시 보지 않기</Text>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={popup.showDontShowAgain && onDontShowAgain ? onDontShowAgain : onClose}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name="close" size={18} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
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
                {popup.buttons.map((button, index) => renderButton(button, index))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContainer: {
    width: MODAL_WIDTH,
    maxWidth: 400,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dontShowAgainLabel: {
    ...Typography.small,
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    ...Typography.heading3,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.xs,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonMargin: {
    marginBottom: Spacing.xs,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.surfaceLight,
  },
  textButton: {
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm,
  },
  buttonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  primaryButtonText: {
    color: Colors.background,
  },
  secondaryButtonText: {
    color: Colors.text,
  },
  textButtonText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});

export default ModalPopup;
