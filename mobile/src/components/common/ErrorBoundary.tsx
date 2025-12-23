/**
 * ErrorBoundary - 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 에러를 잡아서 폴백 UI를 표시
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // 에러 로깅 (Sentry 등 연동 가능)
    console.error('ErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    // 콜백 호출
    this.props.onError?.(error, errorInfo);

    // TODO: Sentry 또는 Firebase Crashlytics로 에러 전송
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails = __DEV__ } = this.props;

    if (hasError) {
      // 커스텀 폴백이 제공된 경우
      if (fallback) {
        return fallback;
      }

      // 기본 에러 UI
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icon name="warning-outline" size={64} color={Colors.error} />
            </View>

            <Text style={styles.title}>문제가 발생했습니다</Text>
            <Text style={styles.message}>
              앱에서 예기치 않은 오류가 발생했습니다.{'\n'}
              다시 시도해 주세요.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={this.handleRetry}
              activeOpacity={0.8}
            >
              <Icon name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>

            {/* 개발 모드에서만 에러 상세 표시 */}
            {showDetails && error && (
              <ScrollView style={styles.detailsContainer}>
                <Text style={styles.detailsTitle}>Error Details (Dev Only)</Text>
                <Text style={styles.errorName}>{error.name}</Text>
                <Text style={styles.errorMessage}>{error.message}</Text>
                {errorInfo && (
                  <Text style={styles.stackTrace}>
                    {errorInfo.componentStack}
                  </Text>
                )}
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return children;
  }
}

/**
 * 함수형 컴포넌트에서 사용하기 쉬운 HOC
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary fallback={fallback}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundary;
}

/**
 * 특정 영역만 감싸는 가벼운 에러 바운더리
 */
export const SafeArea: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <ErrorBoundary
    fallback={
      fallback || (
        <View style={styles.safeAreaFallback}>
          <Icon name="alert-circle-outline" size={24} color={Colors.textMuted} />
          <Text style={styles.safeAreaText}>콘텐츠를 불러올 수 없습니다</Text>
        </View>
      )
    }
  >
    {children}
  </ErrorBoundary>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.heading2,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  retryButtonText: {
    ...Typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailsContainer: {
    marginTop: Spacing.xl,
    maxHeight: 200,
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  detailsTitle: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  errorName: {
    ...Typography.caption,
    color: Colors.error,
    fontWeight: '600',
  },
  errorMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  stackTrace: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  safeAreaFallback: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  safeAreaText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
});

export default ErrorBoundary;
