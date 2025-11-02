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
import { PADDING, SPACING } from '../utils/designConstants';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const sections = [
    {
      id: 1,
      title: '1. Принятие условий',
      content: 'Используя CalorieCam, вы соглашаетесь с настоящими условиями использования. Если вы не согласны с этими условиями, пожалуйста, не используйте приложение.',
    },
    {
      id: 2,
      title: '2. Описание сервиса',
      content: 'CalorieCam предоставляет инструменты для отслеживания питания, анализа еды и получения персональных рекомендаций по питанию с использованием искусственного интеллекта.',
    },
    {
      id: 3,
      title: '3. Регистрация и аккаунт',
      content: 'Вы несете ответственность за сохранность ваших учетных данных. Вы соглашаетесь немедленно уведомлять нас о любом несанкционированном использовании вашего аккаунта.',
    },
    {
      id: 4,
      title: '4. Медицинские ограничения',
      content: 'CalorieCam предоставляет образовательную информацию и не заменяет профессиональную медицинскую консультацию. Всегда консультируйтесь с врачом перед изменением диеты.',
    },
    {
      id: 5,
      title: '5. Интеллектуальная собственность',
      content: 'Все материалы, включая дизайн, текст, графику, логотипы и программное обеспечение, являются собственностью CalorieCam и защищены законами об авторском праве.',
    },
    {
      id: 6,
      title: '6. Ограничение ответственности',
      content: 'CalorieCam предоставляется "как есть" без гарантий. Мы не несем ответственности за любой ущерб, возникший в результате использования или невозможности использования приложения.',
    },
    {
      id: 7,
      title: '7. Отмена и возврат',
      content: 'Подписки могут быть отменены в любое время через настройки приложения. Возврат средств осуществляется в соответствии с политикой магазина приложений.',
    },
    {
      id: 8,
      title: '8. Изменения условий',
      content: 'Мы оставляем за собой право изменять эти условия в любое время. Продолжение использования приложения после изменений означает ваше согласие с новыми условиями.',
    },
    {
      id: 9,
      title: '9. Контакты',
      content: 'По вопросам об условиях использования обращайтесь: legal@caloriecam.com',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 300 }}
        >
          <View style={styles.content}>
            <Text style={[styles.lastUpdated, { color: colors.textTertiary }]}>Последнее обновление: {new Date().toLocaleDateString('ru-RU')}</Text>
            
            <Text style={[styles.intro, { color: colors.text }]}>
              Пожалуйста, внимательно прочитайте эти условия использования перед использованием CalorieCam.
            </Text>

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  headerPlaceholder: {
    width: 24,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.xl,
    paddingBottom: PADDING.xxxl,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: SPACING.md,
    fontStyle: 'italic',
  },
  intro: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: SPACING.sm,
  },
  sectionContent: {
    fontSize: 15,
    color: '#3A3A3C',
    lineHeight: 22,
  },
});

