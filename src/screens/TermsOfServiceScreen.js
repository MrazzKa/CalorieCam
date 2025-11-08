import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { useTheme } from '../contexts/ThemeContext';
import { useI18n } from '../../app/i18n/hooks';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { colors, tokens } = useTheme();
  const { t } = useI18n();

  const sections = [
    {
      id: 1,
      title: t('terms.sections.acceptance.title'),
      content: t('terms.sections.acceptance.content'),
    },
    {
      id: 2,
      title: t('terms.sections.description.title'),
      content: t('terms.sections.description.content'),
    },
    {
      id: 3,
      title: t('terms.sections.registration.title'),
      content: t('terms.sections.registration.content'),
    },
    {
      id: 4,
      title: t('terms.sections.userContent.title'),
      content: t('terms.sections.userContent.content'),
    },
    {
      id: 5,
      title: t('terms.sections.prohibited.title'),
      content: t('terms.sections.prohibited.content'),
    },
    {
      id: 6,
      title: t('terms.sections.intellectual.title'),
      content: t('terms.sections.intellectual.content'),
    },
    {
      id: 7,
      title: t('terms.sections.limitation.title'),
      content: t('terms.sections.limitation.content'),
    },
    {
      id: 8,
      title: t('terms.sections.changes.title'),
      content: t('terms.sections.changes.content'),
    },
    {
      id: 9,
      title: t('terms.sections.contact.title'),
      content: t('terms.sections.contact.content'),
    },
  ];

  const styles = React.useMemo(() => createStyles(tokens, colors), [tokens, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('terms.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 300 }}>
          <View style={styles.content}>
            <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>
              {t('terms.lastUpdated')}: {new Date().toLocaleDateString()}
            </Text>

            <Text style={[styles.intro, { color: colors.text }]}>{t('terms.intro')}</Text>

            {sections.map((section, index) => (
              <MotiView
                key={section.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 15, delay: index * 100 }}
              >
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
                  <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{section.content}</Text>
                </View>
              </MotiView>
            ))}
          </View>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (tokens, colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: tokens.spacing.xl,
      paddingVertical: tokens.spacing.lg,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: tokens.typography.headingM.fontSize,
      fontWeight: tokens.typography.headingM.fontWeight,
    },
    headerPlaceholder: {
      width: 24,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingHorizontal: tokens.spacing.xl,
      paddingTop: tokens.spacing.xl,
      paddingBottom: tokens.spacing.xxxl,
      gap: tokens.spacing.lg,
    },
    lastUpdated: {
      fontSize: tokens.typography.caption.fontSize,
      fontStyle: 'italic',
    },
    intro: {
      fontSize: tokens.typography.body.fontSize,
      lineHeight: tokens.typography.body.lineHeight,
    },
    section: {
      gap: tokens.spacing.xs,
      paddingBottom: tokens.spacing.lg,
    },
    sectionTitle: {
      fontSize: tokens.typography.headingS.fontSize,
      fontWeight: tokens.typography.headingS.fontWeight,
    },
    sectionContent: {
      fontSize: tokens.typography.body.fontSize,
      lineHeight: tokens.typography.body.lineHeight,
    },
  });

