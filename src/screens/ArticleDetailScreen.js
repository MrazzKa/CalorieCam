import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MotiView } from 'moti';
import { useTheme } from '../contexts/ThemeContext';
import ApiService from '../services/apiService';
import { PADDING, SPACING, BORDER_RADIUS } from '../utils/designConstants';

// Simple Markdown renderer (basic)
const renderMarkdown = (content, colors) => {
  const lines = content.split('\n');
  return lines.map((line, index) => {
    if (line.startsWith('# ')) {
      return (
        <Text key={index} style={[styles.markdownH1, { color: colors.text }]}>
          {line.substring(2)}
        </Text>
      );
    } else if (line.startsWith('## ')) {
      return (
        <Text key={index} style={[styles.markdownH2, { color: colors.text }]}>
          {line.substring(3)}
        </Text>
      );
    } else if (line.startsWith('### ')) {
      return (
        <Text key={index} style={[styles.markdownH3, { color: colors.text }]}>
          {line.substring(4)}
        </Text>
      );
    } else if (line.trim() === '') {
      return <View key={index} style={{ height: SPACING.md }} />;
    } else {
      return (
        <Text key={index} style={[styles.markdownText, { color: colors.textSecondary }]}>
          {line}
        </Text>
      );
    }
  });
};

export default function ArticleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { slug } = route.params;
  const { colors } = useTheme();
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [slug]);

  const loadArticle = async () => {
    try {
      setIsLoading(true);
      const data = await ApiService.getArticleBySlug(slug);
      setArticle(data);
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !article) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Загрузка...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerPlaceholder} />
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <View style={styles.content}>
            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>{article.title}</Text>

            {/* Meta */}
            <View style={styles.meta}>
              <Text style={[styles.date, { color: colors.textTertiary }]}>
                {new Date(article.createdAt || article.publishedAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              {article.viewCount > 0 && (
                <View style={styles.viewCount}>
                  <Ionicons name="eye" size={14} color={colors.textTertiary} />
                  <Text style={[styles.viewCountText, { color: colors.textTertiary }]}>
                    {article.viewCount}
                  </Text>
                </View>
              )}
            </View>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {article.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: colors.inputBackground }]}>
                    <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Content */}
            <View style={styles.contentSection}>
              {renderMarkdown(article.contentMd || article.excerpt || '', colors)}
            </View>
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.lg,
    borderBottomWidth: 1,
  },
  headerPlaceholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.xl,
    paddingBottom: PADDING.xxxl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: SPACING.md,
    lineHeight: 36,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  date: {
    fontSize: 14,
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCountText: {
    fontSize: 14,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  tag: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentSection: {
    marginTop: SPACING.md,
  },
  markdownH1: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  markdownH2: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  markdownH3: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  markdownText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: SPACING.sm,
  },
});

