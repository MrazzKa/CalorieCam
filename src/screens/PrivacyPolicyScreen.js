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

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const sections = [
    {
      id: 1,
      title: '1. Сбор информации',
      content: 'Мы собираем информацию, которую вы предоставляете при регистрации и использовании приложения, включая персональные данные, информацию о питании и фотографии еды.',
    },
    {
      id: 2,
      title: '2. Использование информации',
      content: 'Ваша информация используется для предоставления персонализированных рекомендаций по питанию, анализа пищи и улучшения работы приложения.',
    },
    {
      id: 3,
      title: '3. Защита данных',
      content: 'Мы используем современные методы шифрования и безопасного хранения данных для защиты вашей личной информации.',
    },
    {
      id: 4,
      title: '4. Обмен данными',
      content: 'Мы не продаем и не передаем ваши личные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством.',
    },
    {
      id: 5,
      title: '5. Ваши права',
      content: 'Вы имеете право на доступ, исправление, удаление ваших данных в любое время через настройки приложения.',
    },
    {
      id: 6,
      title: '6. Cookies и аналитика',
      content: 'Мы используем cookies и аналитические инструменты для улучшения работы приложения и понимания того, как вы его используете.',
    },
    {
      id: 7,
      title: '7. Изменения в политике',
      content: 'Мы можем обновлять эту политику конфиденциальности. О существенных изменениях мы уведомим вас через приложение.',
    },
    {
      id: 8,
      title: '8. Контакты',
      content: 'Если у вас есть вопросы о нашей политике конфиденциальности, свяжитесь с нами по адресу: privacy@caloriecam.com',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Policy</Text>
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
              CalorieCam ценит вашу конфиденциальность. Эта политика описывает, как мы собираем, используем и защищаем вашу информацию.
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

