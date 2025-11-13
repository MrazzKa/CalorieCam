# Исправление ошибки билда на Railway

## Проблема

Railway не может найти файл `apps/api/food/food-health-score.util.ts` при билде:
```
error TS2307: Cannot find module './food-health-score.util' or its corresponding type declarations.
```

## Причина

Файл существует локально, но **НЕ включен в HEAD коммит** (проверено через `git show HEAD:`). Railway использует файлы из git коммита, поэтому файл не попадает в build context.

## Решение

Файл нужно явно добавить в git и включить в коммит:

```bash
# 1. Добавить файл в git
git add apps/api/food/food-health-score.util.ts

# 2. Проверить, что файл добавлен
git status apps/api/food/food-health-score.util.ts

# 3. Если файл не показывает изменений, принудительно добавить
git add -f apps/api/food/food-health-score.util.ts

# 4. Проверить staged files
git diff --cached --name-only | grep health

# 5. Включить в коммит все изменения
git add -A

# 6. Создать/обновить коммит
git commit -m "fix: add missing food-health-score.util.ts file for Railway build"

# 7. Запушить
git push origin main
```

## Альтернативное решение (если файл не добавляется)

Если файл не добавляется в git, возможно, он был удален ранее. Можно пересоздать файл:

```bash
# 1. Убедиться, что файл существует
ls -la apps/api/food/food-health-score.util.ts

# 2. Если файл существует, принудительно добавить
git add -f apps/api/food/food-health-score.util.ts

# 3. Если не помогло, удалить из кэша и добавить заново
git rm --cached apps/api/food/food-health-score.util.ts
git add apps/api/food/food-health-score.util.ts
```

## Проверка

После коммита и пуша, Railway автоматически запустит новый билд. Проверьте логи билда - ошибка должна исчезнуть.

