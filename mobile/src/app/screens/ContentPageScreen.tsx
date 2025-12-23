import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import RenderHtml from 'react-native-render-html';
import { Colors, Typography, Spacing, API_BASE_URL } from '../../constants';
import { RootStackParamList, ContentPage } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ContentPageRouteProp = RouteProp<RootStackParamList, 'ContentPage'>;

const ContentPageScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ContentPageRouteProp>();
  const { slug, title: initialTitle } = route.params;
  const { width } = useWindowDimensions();

  const [page, setPage] = useState<ContentPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/pages?slug=${slug}`);
      const data = await response.json();

      if (data.success && data.data) {
        setPage(data.data);
      } else {
        setError(data.error || '페이지를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('Failed to fetch page:', err);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  // HTML 렌더링 스타일
  const tagsStyles = {
    body: {
      color: Colors.text,
      fontSize: 16,
      lineHeight: 26,
    },
    p: {
      color: Colors.text,
      marginBottom: 16,
    },
    h1: {
      color: Colors.text,
      fontSize: 24,
      fontWeight: '700' as const,
      marginBottom: 16,
      marginTop: 24,
    },
    h2: {
      color: Colors.text,
      fontSize: 20,
      fontWeight: '600' as const,
      marginBottom: 12,
      marginTop: 20,
    },
    h3: {
      color: Colors.text,
      fontSize: 18,
      fontWeight: '600' as const,
      marginBottom: 10,
      marginTop: 16,
    },
    ul: {
      color: Colors.text,
      marginBottom: 16,
    },
    ol: {
      color: Colors.text,
      marginBottom: 16,
    },
    li: {
      color: Colors.text,
      marginBottom: 8,
    },
    a: {
      color: Colors.primary,
      textDecorationLine: 'underline' as const,
    },
    strong: {
      color: Colors.text,
      fontWeight: '600' as const,
    },
    em: {
      color: Colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    blockquote: {
      borderLeftWidth: 4,
      borderLeftColor: Colors.primary,
      paddingLeft: 16,
      marginLeft: 0,
      marginVertical: 16,
      backgroundColor: Colors.surface,
      padding: 16,
      borderRadius: 8,
    },
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initialTitle || '로딩 중...'}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{initialTitle || '오류'}</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPage}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {page?.title || initialTitle}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {page?.content ? (
          <RenderHtml
            contentWidth={width - Spacing.lg * 2}
            source={{ html: page.content }}
            tagsStyles={tagsStyles}
          />
        ) : (
          <Text style={styles.emptyText}>내용이 없습니다.</Text>
        )}

        {page?.updatedAt && (
          <Text style={styles.lastUpdated}>
            마지막 업데이트: {new Date(page.updatedAt).toLocaleDateString('ko-KR')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: Spacing.sm,
  },
  headerRight: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  lastUpdated: {
    ...Typography.caption,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
});

export default ContentPageScreen;
