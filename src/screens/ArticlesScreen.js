import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { useTheme } from '../contexts/ThemeContext';
import ApiService from '../services/apiService';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

export default function ArticlesScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [articles, setArticles] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const [feedData, featuredData] = await Promise.all([
        ApiService.getArticlesFeed(1, 20),
        ApiService.getFeaturedArticles(),
      ]);
      setArticles(feedData.articles || []);
      setFeatured(featuredData || []);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const result = await ApiService.searchArticles(query);
      setSearchResults(result.articles || []);
    } catch (error) {
      console.error('Error searching articles:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleArticlePress = (slug) => {
    navigation.navigate('ArticleDetail', { slug });
  };

  const renderArticleCard = (article, index, isFeatured = false) => (
    <MotiView
      key={article.id}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: index * 50 }}
    >
      <TouchableOpacity
        style={[styles.articleCard, { backgroundColor: colors.card }]}
        onPress={() => handleArticlePress(article.slug)}
      >
        {isFeatured && (
          <View style={[styles.featuredBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        <Text style={[styles.articleTitle, { color: colors.text }]}>{article.title}</Text>
        {article.excerpt && (
          <Text style={[styles.articleExcerpt, { color: colors.textSecondary }]} numberOfLines={2}>
            {article.excerpt}
          </Text>
        )}
        <View style={styles.articleFooter}>
          <View style={styles.tagsContainer}>
            {article.tags?.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={[styles.tag, { backgroundColor: colors.inputBackground }]}>
                <Text style={[styles.tagText, { color: colors.primary }]}>{tag}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.articleDate, { color: colors.textTertiary }]}>
            {new Date(article.createdAt || article.publishedAt).toLocaleDateString('ru-RU')}
          </Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  const displayArticles = searchQuery ? searchResults : articles;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Статьи</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={20} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, backgroundColor: colors.inputBackground }]}
          placeholder="Поиск статей..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadArticles} tintColor={colors.primary} />
        }
      >
        {/* Featured Section */}
        {featured.length > 0 && !searchQuery && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 100 }}
          >
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Рекомендуемое</Text>
              {featured.map((article, index) => renderArticleCard(article, index, true))}
            </View>
          </MotiView>
        )}

        {/* Articles List */}
        <View style={styles.section}>
          {!searchQuery && (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Все статьи</Text>
          )}
          {searchQuery && (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {isSearching ? 'Поиск...' : `Найдено: ${searchResults.length}`}
            </Text>
          )}
          
          {displayArticles.length === 0 && !isLoading && (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {searchQuery ? 'Статьи не найдены' : 'Статьи скоро появятся'}
              </Text>
            </View>
          )}

          {displayArticles.map((article, index) => renderArticleCard(article, index))}
        </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerPlaceholder: {
    width: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.lg,
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: PADDING.lg,
  },
  articleCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
    position: 'relative',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
    gap: 4,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  articleExcerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    flex: 1,
  },
  tag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  articleDate: {
    fontSize: 12,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: PADDING.xxxl,
  },
  emptyText: {
    fontSize: 16,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});

