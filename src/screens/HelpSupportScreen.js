import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MotiView } from 'moti';
import { useTheme } from '../contexts/ThemeContext';
import { PADDING, SPACING, BORDER_RADIUS, SHADOW } from '../utils/designConstants';

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();

  const faqItems = [
    {
      id: 1,
      question: 'Как использовать приложение?',
      answer: 'Сделайте фото еды или выберите из галереи. Наш AI проанализирует блюдо и покажет калорийность и питательные вещества.',
    },
    {
      id: 2,
      question: 'Сколько фото я могу проанализировать?',
      answer: 'Бесплатные пользователи могут анализировать до 5 фото в день. Подписчики имеют неограниченный доступ.',
    },
    {
      id: 3,
      question: 'Как сохранить прием пищи?',
      answer: 'После анализа нажмите "Save to Journal" чтобы добавить прием пищи в ваш журнал.',
    },
    {
      id: 4,
      question: 'Можно ли редактировать результаты анализа?',
      answer: 'Да, вы можете нажать на любой ингредиент и вручную скорректировать его значения.',
    },
    {
      id: 5,
      question: 'Как работает AI Assistant?',
      answer: 'AI Assistant предоставляет персональные советы по питанию на основе вашего профиля и пищевых привычек.',
    },
  ];

  const contactOptions = [
    {
      id: 1,
      title: 'Email Support',
      subtitle: 'support@eatsense.ch',
      icon: 'mail-outline',
      color: '#007AFF',
      onPress: () => Linking.openURL('mailto:support@eatsense.ch'),
    },
    {
      id: 2,
      title: 'Feedback',
      subtitle: 'Поделитесь своими идеями',
      icon: 'chatbubble-outline',
      color: '#34C759',
      onPress: () => {
        // Can add Feedback screen navigation here if needed
        Alert.alert('Feedback', 'Спасибо за интерес! Функция обратной связи скоро появится.');
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & Support</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* FAQ Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15 }}
        >
            <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Часто задаваемые вопросы</Text>
            {faqItems.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ type: 'spring', damping: 15, delay: index * 50 }}
              >
                <View style={[styles.faqCard, { backgroundColor: colors.card }]}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{item.question}</Text>
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{item.answer}</Text>
                </View>
              </MotiView>
            ))}
          </View>
        </MotiView>

        {/* Contact Section */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 15, delay: 200 }}
        >
            <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Свяжитесь с нами</Text>
            {contactOptions.map((option, index) => (
              <MotiView
                key={option.id}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15, delay: 250 + index * 50 }}
              >
                <TouchableOpacity
                  style={[styles.contactCard, { backgroundColor: colors.card }]}
                  onPress={option.onPress}
                >
                  <View style={[styles.contactIcon, { backgroundColor: `${option.color}15` }]}>
                    <Ionicons name={option.icon} size={24} color={option.color} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={[styles.contactTitle, { color: colors.text }]}>{option.title}</Text>
                    <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.xl,
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: PADDING.lg,
  },
  faqCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    marginBottom: SPACING.md,
    ...SHADOW.sm,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: PADDING.md,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
  },
});

