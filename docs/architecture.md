# Архитектура бэкенда — Аура Света

## Стек технологий

| Технология | Версия | Назначение |
|---|---|---|
| Next.js | 16.2.1 | App Router, SSR/SSG |
| Prisma | 7.6 | ORM (driver-adapter для Neon) |
| NeonDB | — | PostgreSQL (serverless) |
| tRPC | 11 | Type-safe API layer |
| better-auth | latest | Аутентификация (email+пароль, OAuth) |
| Jotai | latest | Клиентское состояние (анонимная корзина) |
| TanStack Query | 5 | Кэширование данных (через tRPC) |
| Recharts | latest | Графики в админ-панели |
| Papaparse | latest | Import/Export CSV |

## Структура файлов (бэкенд)

```
prisma/
  schema.prisma          # Все модели (17 таблиц)
  prisma.config.ts       # Конфигурация Prisma 7

lib/
  prisma.ts              # PrismaClient singleton (Neon adapter)
  trpc/
    init.ts              # initTRPC, контекст, process, middleware
    client.tsx           # TRPCProvider для client-компонентов
    server.tsx           # RSC helper (createHydrationHelpers)
    query-client.ts      # QueryClient factory
    routers/
      _app.ts            # Корневой роутер
      products.ts        # CRUD товаров + фильтры
      categories.ts      # Дерево категорий
      properties.ts      # Динамичные свойства
      cart.ts            # Корзина (авторизованная)
      favorites.ts       # Избранное
      orders.ts          # Заказы (пользователь + админ)
      pages.ts           # CMS-страницы с версионированием
      profile.ts         # Профиль пользователя
      anonymous.ts       # Анонимная сессия (корзина/избранное)
      admin.ts           # Статистика, экспорт/импорт
      webhooks.ts        # Webhook-управление
  auth/
    auth.ts              # better-auth конфигурация
    auth-client.ts       # createAuthClient для client
    auth-utils.ts        # getSession, requireAuth, requireAdmin
  store/
    anonymous.ts         # Jotai atoms для анонимных данных

app/
  api/
    trpc/[trpc]/route.ts # tRPC API endpoint
    auth/[...all]/route.ts # better-auth endpoint
  (auth)/
    login/               # Страница входа
    register/            # Страница регистрации
  admin/
    layout.tsx           # Сайдбар + requireAdmin
    page.tsx             # Дашборд (статистика, графики)
    products/            # CRUD товаров
    categories/          # Дерево категорий
    properties/          # Динамичные свойства
    pages/               # CMS-страницы
    orders/              # Заказы
    import-export/       # CSV/JSON импорт-экспорт
    webhooks/            # Вебхуки
```

## Модели данных (Prisma)

### Пользователи и авторизация
- **User** — роли: USER, EDITOR, ADMIN
- **Session**, **Account**, **Verification** — better-auth модели

### Каталог
- **Category** — иерархия (parent/children)
- **Product** — цена, изображения (JSON), бренд, badges
- **Property** — динамич. свойства (STRING, NUMBER, BOOLEAN, SELECT)
- **ProductPropertyValue** — M:N свойства ↔ товары

### Заказы и корзина
- **Cart** — привязана к User
- **AnonymousSession** — анонимная корзина/избранное (JSON)
- **Favorite** — избранные товары
- **Order + OrderItem** — статусы: PENDING → PAID → SHIPPED → DELIVERED

### CMS
- **Page** — контентные страницы с SEO-полями
- **PageVersion** — версионнирование контента
- **Webhook** — уведомления о событиях (product.*, order.*)

## tRPC-процедуры

### Роли доступа
- `baseProcedure` — публичный доступ
- `protectedProcedure` — авторизованный пользователь
- `adminProcedure` — только ADMIN
- `editorProcedure` — ADMIN или EDITOR

### Основные эндпоинты
| Роутер | Процедуры |
|---|---|
| products | getMany, getBySlug, getById, getBrands, create*, update*, delete* |
| categories | getAll, getTree, getBySlug, create*, update*, delete* |
| properties | getAll, getById, create*, update*, delete* |
| cart | get, update, addItem, removeItem, clear |
| favorites | getAll, toggle, check, remove |
| orders | getMyOrders, getById, create, getAllOrders*, updateStatus* |
| pages | getPublished, getBySlug, getAll*, getById*, create*, update*, delete* |
| profile | get, update, getStats |
| anonymous | init, getSession, updateCart, updateFavorites, migrateToUser |
| admin | getStats*, getRevenueChart*, exportProducts*, importProducts* |
| webhooks | getAll*, create*, update*, delete*, test* |

\* — требует admin/editor роль

## Интеграция фронтенд ↔ бэкенд

### Server Components (RSC)
```tsx
import { trpc, HydrateClient } from '@/lib/trpc/server'

export default async function Page() {
  const data = await trpc.products.getMany({ page: 1, limit: 20 })
  return <HydrateClient>...</HydrateClient>
}
```

### Client Components
```tsx
'use client'
import { trpc } from '@/lib/trpc/client'

export default function Component() {
  const { data } = trpc.products.getMany.useQuery({ page: 1 })
  return <div>...</div>
}
```

### Сервисы (совместимость)
`productService.ts` и `categoryService.ts` автоматически используют:
1. Данные из БД (если есть)
2. Mock-данные (fallback)

## Команды

```bash
# Запуск dev
npm run dev

# Миграции
npx prisma migrate dev --name <name>
npx prisma generate

# Сборка
npm run build
```
