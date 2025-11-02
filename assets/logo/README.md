# Логотип CalorieCam

## Текущий файл

✅ `Logo.svg` - исходный файл логотипа (уже добавлен)

## Конвертация в PNG для splash screen

Для использования на splash screen нужно конвертировать SVG в PNG:

### Автоматическая конвертация (если установлен ImageMagick или Inkscape):

```bash
npm run convert-logo
```

Это создаст файл `logo.png` (2048x2048px) из `Logo.svg`.

### Ручная конвертация:

1. **Онлайн инструменты:**
   - https://svgtopng.com/
   - https://cloudconvert.com/svg-to-png
   - Загрузите `Logo.svg`
   - Установите размер: 2048x2048px
   - Скачайте как `logo.png` в эту папку

2. **Или используйте ImageMagick:**
   ```bash
   convert -background none -resize 2048x2048 assets/logo/Logo.svg assets/logo/logo.png
   ```

3. **Или Inkscape:**
   ```bash
   inkscape --export-type=png --export-width=2048 --export-height=2048 \
     --export-filename=assets/logo/logo.png assets/logo/Logo.svg
   ```

## Требования к PNG

- Формат: PNG
- Размер: 2048x2048px (для лучшего качества на всех устройствах)
- Фон: прозрачный или белый
- Имя файла: `logo.png` (нижний регистр)

