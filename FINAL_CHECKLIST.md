# Финальный чеклист перед коммитом

## ✅ Все изменения завершены

### 1. Google OAuth ✅
- ✅ Обновлен на современный провайдер `expo-auth-session/providers/google`
- ✅ Поддержка отдельных Client ID для iOS/Android/Web
- ✅ Использует `Google.useAuthRequest` с `makeRedirectUri`
- ✅ Добавлены методы `signInWithApple` и `signInWithGoogle` в ApiService

### 2. SMTP Mailer ✅
- ✅ Переведен на SMTP (Infomaniak)
- ✅ Добавлен health-check endpoint: `GET /.well-known/email`
- ✅ Проверяет подключение к SMTP без отправки письма
- ✅ Возвращает статус 200 при успехе, 503 при ошибке

### 3. Начальный экран входа ✅
- ✅ Стиль YAZIO с тремя кнопками:
  1. **Apple Sign In** (только iOS)
  2. **Continue With Google** (все платформы)
  3. **Sign Up With E-mail** (все платформы)
- ✅ Отображается текст принятия Terms and Conditions

### 4. Переименование CalorieCam → EatSense ✅
- ✅ `app.config.js`: `name: "EatSense"`, `slug: "eatsense"`, `scheme: "eatsense"`
- ✅ Bundle ID: `ch.eatsense.app` (iOS и Android)
- ✅ Все UI тексты обновлены
- ✅ README и документация обновлены
- ✅ Deeplink схемы: `eatsense://` и `https://eatsense.app`
- ✅ iOS: `CFBundleDisplayName` будет установлен из `app.config.js` (Expo автоматически)
- ✅ Android: `app_name` будет установлен из `app.config.js` (Expo автоматически)

### 5. Environment Variables ✅

#### Корневой `.env` (для Expo):
```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_BASE_URL=https://api.eatsense.app
EXPO_PUBLIC_APP_NAME=EatSense
EXPO_PUBLIC_APP_SCHEME=eatsense
EXPO_PUBLIC_GOOGLE_CLIENT_ID=535303723114-95afjkjhsnns16s2kk3gh9ld435g8idl.apps.googleusercontent.com
```

#### `apps/api/.env` (нужно исправить):
```env
# Исправить эти 2 строки:
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eatsense  # было: caloriecam
MAGIC_LINK_URL=https://eatsense.app/v1/auth/magic/consume  # было: caloriecam.app
```

### 6. Health Check Endpoints ✅

- ✅ `GET /.well-known/health` - общий health check
- ✅ `GET /.well-known/email` - проверка SMTP подключения (новый)

### 7. UserProfile и Account Management ✅

- ✅ `updateProfile` создает/обновляет `UserProfile` таблицу
- ✅ `deleteAccount` правильно очищает OTP по email
- ✅ Исправлена ошибка Prisma (удалено конфликтное `include` + `select`)

## 🚀 Команды для коммита

```bash
# 1. Проверить статус
git status

# 2. Добавить все изменения (кроме .env - они в .gitignore)
git add .

# 3. Проверить, что .env не попали в коммит
git status | grep -i ".env"  # Должно быть пусто

# 4. Создать коммит
git commit -m "feat: prepare for TestFlight submission

- Update Google OAuth to use modern expo-auth-session provider with separate iOS/Android/Web Client IDs
- Add SMTP health check endpoint (GET /.well-known/email)
- Fix UserProfile creation/update in updateProfile method
- Fix OTP cleanup in deleteAccount (use email instead of userId)
- Fix Prisma query issue (remove conflicting include+select)
- Update all branding from CalorieCam to EatSense
- Add signInWithApple and signInWithGoogle methods to ApiService
- Configure production environment variables
- Initial auth screen with Apple, Google, and Email options (YAZIO-style)

Ready for TestFlight build and submission via GitHub Actions."

# 5. Запушить в GitHub
git push origin main
```

## ⚠️ Важные замечания

1. **Исправьте `apps/api/.env`** перед коммитом:
   - `DATABASE_URL` → заменить `caloriecam` на `eatsense`
   - `MAGIC_LINK_URL` → заменить `caloriecam.app` на `eatsense.app`

2. **Проверьте SMTP health check** после деплоя:
   ```bash
   curl https://api.eatsense.app/.well-known/email
   ```

3. **iOS/Android имена приложения** будут автоматически установлены из `app.config.js` при `expo prebuild` или `eas build`

4. **GitHub Secrets** должны быть настроены для автоматического билда и сабмита

## 📝 Что будет автоматически сгенерировано при билде

- iOS `Info.plist` - `CFBundleDisplayName: "EatSense"` (из `app.config.js`)
- Android `strings.xml` - `app_name: "EatSense"` (из `app.config.js`)

Expo автоматически создаст эти файлы на основе `app.config.js`.

