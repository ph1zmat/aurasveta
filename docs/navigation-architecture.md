# Архитектура навигации сайта (Header/Footer)

## Цель

Перевести ссылки хедера и футера с хардкода на управляемую конфигурацию в базе данных, сохранив безопасный fallback для непрерывности storefront.

## Модель данных

### Prisma

- `NavZone`: enum зон навигации (`HEADER`, `FOOTER`)
- `SiteNavItem`:
  - `zone` — зона навигации
  - `pageId` — привязка к CMS-странице (`Page`)
  - `labelOverride` — необязательное переопределение названия
  - `order` — порядок отображения
  - `isActive` — флаг публикации пункта

Ограничения:

- `@@unique([zone, pageId])` — страница не может повторяться внутри зоны
- индекс `@@index([zone, isActive, order])` для быстрых публичных выборок

## Серверный API (tRPC)

Роутер: `lib/trpc/routers/siteNav.ts`

### Query

- `siteNav.getPublicByZone({ zone })`
  - возвращает только активные пункты
  - возвращает только опубликованные страницы (`Page.isPublished = true`)
  - сортирует по `order`

- `siteNav.getEditorState({ zone })`
  - возвращает текущий состав зоны
  - возвращает список опубликованных страниц для выпадающего списка в админке

### Mutation

- `siteNav.upsertItem`
- `siteNav.removeItem`
- `siteNav.reorder`
- `siteNav.replaceZone` (батч-сохранение зоны)

Валидации:

- Проверка уникальности страницы внутри зоны
- Проверка, что страница опубликована

После изменений вызывается `revalidatePath('/', 'layout')` для обновления хедера/футера без деплоя.

## Storefront интеграция

- `widgets/header/ui/TopBar.tsx` и `widgets/footer/ui/Footer.tsx` читают навигацию из БД через `lib/navigation/site-nav.ts`.
- Если в БД нет пунктов для зоны или чтение временно недоступно, используются fallback-ссылки из `shared/config/legacy-site-nav.ts`.

## Админ-интерфейс

Экран: `app/admin/navigation/`

Возможности:

- отдельные табы для `HEADER` и `FOOTER`
- drag-and-drop сортировка
- выбор страниц из списка опубликованных CMS-страниц
- inline-редактирование `labelOverride`
- переключение активности
- защита от дублей в зоне

## Миграция существующих ссылок

Скрипт: `scripts/migrate-site-nav-items.ts`

Режимы:

- dry-run (по умолчанию):
  - анализирует legacy-ссылки
  - сопоставляет со slug опубликованных CMS-страниц
  - формирует отчёт migrated/skipped

- apply:
  - `--apply`
  - очищает зоны `HEADER`/`FOOTER`
  - записывает сопоставленные пункты в `SiteNavItem`

### Ограничения миграции

- Мигрируются только ссылки, которые сопоставились с опубликованной CMS-страницей
- Несопоставленные URL остаются в fallback-конфиге и не ломают storefront

## Rollback

Если нужно быстро откатить изменение поведения:

1. Очистить `SiteNavItem` по зоне(ам)
2. Storefront автоматически вернётся на fallback-ссылки из `legacy-site-nav.ts`

Это не требует отката схемы Prisma.
