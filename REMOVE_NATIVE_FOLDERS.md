# Удаление ios/ и android/ папок

## Почему нужно удалить

1. **Папки в `.gitignore`** — они не должны быть в репозитории
2. **EAS Build генерирует их автоматически** из `app.config.js`
3. **Конфликты версий** — EAS использует нативные файлы вместо конфигурации

## Что сделать

```bash
# Удалить папки локально (они в .gitignore, так что безопасно)
rm -rf ios android

# Теперь при сборке EAS сгенерирует их заново из app.config.js
pnpm build:ios
```

## Что будет

После удаления:
- ✅ EAS Build сгенерирует `ios/` и `android/` автоматически
- ✅ `buildNumber: "27"` из `app.config.js` будет использоваться
- ✅ `CFBundleDisplayName: "EatSense"` будет применяться
- ✅ Все настройки будут синхронизированы

## После удаления

1. Закоммитить только `app.config.js`:
   ```bash
   git add app.config.js
   git commit -m "chore: bump buildNumber to 27"
   git push
   ```

2. Собрать новый билд:
   ```bash
   pnpm build:ios
   ```

3. Отправить в App Store:
   ```bash
   pnpm eas:submit:ios
   ```

## Важно

- Папки `ios/` и `android/` будут автоматически пересозданы при сборке
- Они остаются в `.gitignore`, так что не попадут в git
- При каждой сборке EAS генерирует их заново из актуальной конфигурации

