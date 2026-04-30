<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Аура Света

Файл для AI-агентов. В проекте используется русский язык в комментариях, документации и пользовательских сообщениях.

---

## Обзор проекта

**Аура Света** — интернет-магазин освещения (люстры, светильники, бра). Это монорепозиторий, содержащий:

- **Веб-приложение** (основное) — Next.js 16 App Router с SSR/SSG
- **Десктоп CMS** — Electron-приложение в `desktop/`
- **Мобильное приложение** — Expo / React Native в `mobile/`

Веб-приложение реализует каталог товаров, корзину, избранное, сравнение, CMS-страницы, админ-панель с аналитикой, импорт/экспорт CSV, управление вебхуками и SEO.

---

## Технологический стек

| Слой | Технология |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| React | 19.2 |
| API | tRPC v11 (httpBatchStreamLink, superjson) |
| ORM | Prisma 7.6 + NeonDB PostgreSQL (serverless) |
| Auth | better-auth v1.5 (email/password, GitHub, Google OAuth) |
| State (client) | Jotai (анонимная корзина/избранное), TanStack React Query |
| State (server) | tRPC + Prisma |
| UI | Tailwind CSS 4, shadcn/ui, radix-ui, lucide-react, Recharts |
| Forms | React Hook Form + Zod v4 |
| Tables | TanStack React Table |
| Drag&Drop | @dnd-kit |
| CSV | Papaparse |
| Storage | AWS S3 SDK (совместимо с MinIO) |
| Push | web-push |
| Error tracking | Sentry |
| Testing | Vitest, jsdom, Playwright |
| Desktop | Electron 36 + Vite 6 |
| Mobile | Expo 55 + React Native 0.83 |

---

## Структура проекта (FSD)

Проект использует **Feature-Sliced Design** (FSD). Правило зависимостей:

```
app/ → widgets/ → features/ → entities/ → shared/
```

```
app/                 — маршруты Next.js (pages, layouts, API routes, loading, error, not-found)
entities/            — бизнес-сущности: product, category, cart, spec
features/            — пользовательские фичи: cart, favorites, catalog-filter, compare, product-details
widgets/             — компоновочные виджеты: header, footer, navigation, product-carousel, home-sections
shared/              — переиспользуемый UI, утилиты, типы, моки
lib/                 — инфраструктура: prisma, auth, trpc, store, storage, seo, sections, push
prisma/              — схема, миграции, сиды
scripts/             — TS-скрипты для бэкфилла и конвертации
packages/            — shared-admin (код, общий для админок web + desktop)
desktop/             — Electron CMS-приложение (отдельный package.json)
mobile/              — Expo/React Native приложение (отдельный package.json)
```

### Структура слайса FSD

Каждый слайс (`entities/*/`, `features/*/`, `widgets/*/`) содержит:

```
slice-name/
  ui/          — React-компоненты
  model/       — типы, хуки, стор, адаптеры
  api/         — API-запросы / сервисы
  lib/         — вспомогательные функции
  index.ts     — Public API (экспорт только отсюда)
```

**Правило импорта:** импортировать из слайса только через `index.ts`:

```typescript
// ✅ Правильно
import { ProductCard } from '@/entities/product'

// ❌ Неправильно (нарушение инкапсуляции, ESLint может блокировать)
import ProductCard from '@/entities/product/ui/ProductCard'
```

Примечание: в текущей кодовой базе есть прямые импорты — это допустимо при рефакторинге, но новый код должен следовать правилу.

### Алиасы путей

`@/*` → корень проекта (`./*`).

Также есть алиас для shared-admin пакета:

```json
"@aurasveta/shared-admin": "./packages/shared-admin/src/index.ts"
```

---

## Основные маршруты

| Маршрут | Описание |
|---|---|
| `/` | Главная страница |
| `/catalog` | Каталог товаров |
| `/catalog/[slug]` | Страница категории |
| `/product/[slug]` | Карточка товара |
| `/cart` | Корзина |
| `/favorites` | Избранное |
| `/compare` | Сравнение товаров |
| `/pages/[slug]` | CMS-страницы (О нас, Доставка и т.д.) |
| `/search` | Поиск |
| `/login`, `/register` | Авторизация |
| `/admin/*` | Админ-панель (защищена middleware) |
| `/api/trpc/*` | tRPC API endpoint |
| `/api/auth/*` | better-auth endpoint |

---

## Команды

### Веб-приложение (корень)

```bash
npm run dev                    # Dev-сервер (Turbopack)
npm run build                  # Production-сборка
npm run start                  # Production-запуск
npm run lint                   # ESLint
npm run test                   # Vitest (run once)
npm run test:watch             # Vitest (watch mode)

# Prisma
npx prisma generate            # Генерация клиента
npx prisma migrate dev         # Создать миграцию
npx prisma migrate deploy      # Применить миграции (production)
npx prisma db seed             # Заполнить тестовыми данными
npx prisma studio              # GUI для БД

# Скрипты
npm run page-sections:backfill          # Бэкфилл секций страниц (dry-run)
npm run page-sections:backfill:apply    # Бэкфилл секций страниц (применить)
npm run seo:backfill-metadata           # Бэкфилл SEO-метаданных
npm run convert:svg-to-webp             # Конвертация SVG в WebP
```

### Десктоп-приложение

```bash
cd desktop
npm run dev                    # Vite dev + Electron
npm run build                  # Сборка + electron-builder
npm run build:win              # Сборка под Windows
npm run build:mac              # Сборка под macOS
npm run build:linux            # Сборка под Linux
```

### Мобильное приложение

```bash
cd mobile
npm run start                  # Expo dev server
npm run android                # Сборка под Android
npm run ios                    # Сборка под iOS
npm run build:android          # EAS build (production)
npm run build:apk              # EAS build (preview APK)
```

---

## Архитектура бэкенда

### tRPC

Контекст, роутеры и процедуры в `lib/trpc/`:

- `init.ts` — `createTRPCContext`, процедуры (`baseProcedure`, `protectedProcedure`, `adminProcedure`, `editorProcedure`)
- `routers/_app.ts` — корневой роутер, объединяющий все подроутеры
- Подроутеры: `products-router.ts`, `categories.ts`, `properties.ts`, `cart.ts`, `favorites.ts`, `orders.ts`, `pages.ts`, `profile.ts`, `anonymous.ts`, `admin.ts`, `webhooks.ts`, `search.ts`, `seo.ts`, `cms.ts`, `home.ts`, `homeSection.ts`, `sectionType.ts`, `recommendations.ts`, `compare.ts`, `push.ts`, `setting.ts`

**Процедуры доступа:**

| Процедура | Требования |
|---|---|
| `baseProcedure` | Публичный доступ |
| `protectedProcedure` | Авторизованный пользователь |
| `adminProcedure` | Роль `ADMIN` |
| `editorProcedure` | Роль `ADMIN` или `EDITOR` |

### Auth (better-auth)

Конфигурация в `lib/auth/auth.ts`:

- Email + password (включено)
- GitHub OAuth (опционально, через env)
- Google OAuth (опционально, через env)
- Дополнительные поля пользователя: `role` (USER/EDITOR/ADMIN), `phone`
- Сессия: 1 день, обновление каждый час
- `trustedOrigins` включает localhost, Vercel, desktop и mobile deeplink-схемы

Утилиты в `lib/auth/auth-utils.ts`: `getSession`, `requireAuth`, `requireAdmin`.

### Prisma

Схема в `prisma/schema.prisma` (17+ моделей):

**Пользователи и авторизация:**
- `User` — роли: USER, EDITOR, ADMIN
- `Session`, `Account`, `Verification` — better-auth

**Каталог:**
- `Category` — иерархия (parent/children), режимы MANUAL / FILTER
- `Product` — цена, изображения, бренд, badges, поисковый вектор (tsvector)
- `Property` / `PropertyValue` — динамические свойства
- `ProductPropertyValue` — M:N связь товаров со свойствами
- `ProductImage` — отдельная таблица для изображений товаров

**Заказы и корзина:**
- `Cart` — привязана к User (JSON items)
- `AnonymousSession` — анонимная корзина/избранное (JSON)
- `Favorite` — избранные товары
- `CompareItem` — товары для сравнения
- `Order` / `OrderItem` — статусы: PENDING → PAID → SHIPPED → DELIVERED → CANCELLED

**CMS:**
- `Page` — контентные страницы с SEO-полями, статусы DRAFT / PUBLISHED / ARCHIVED
- `PageVersion` — версионирование контента
- `Section` / `SectionProduct` / `SectionCategory` / `SectionPageReference` / `SectionMediaItem` — секции страниц
- `HomeSection` / `SectionType` — секции главной страницы
- `MediaAsset` — медиа-ассеты
- `Setting` — ключ-значение настроек

**SEO и аналитика:**
- `SeoMetadata` — SEO-метаданные для любых сущностей
- `ProductView` — просмотры товаров (рекомендательная система)
- `SearchQuery` — история поисковых запросов

**Уведомления:**
- `Webhook` — вебхуки на события
- `PushDevice` — устройства для push-уведомлений (FCM / WEB_PUSH)

Prisma использует адаптер Neon (`@prisma/adapter-pg`) для serverless PostgreSQL.

### Middleware (`middleware.ts`)

- Защита `/admin/*` — редирект на `/login` без сессии
- Редирект авторизованных пользователей с `/login` и `/register` на `/`
- CORS для API-роутов (допустимые origin: production + localhost + desktop/mobile)
- Rate limiting (in-memory, для single-instance):
  - `/api/upload` — 5 запросов/мин
  - `/api/trpc/auth.login`, `/api/trpc/auth.register` — 10 запросов/10мин
  - `/api/trpc/search` — 30 запросов/мин

### Storage (S3/MinIO)

Логика в `lib/storage.ts`:
- AWS S3 SDK с поддержкой path-style URL (MinIO)
- Presigned URLs для загрузки/скачивания
- API routes: `/api/upload`, `/api/upload/delete`, `/api/storage/file`, `/api/storage/signed-url`

---

## Фронтенд-архитектура

### Server Components (RSC) vs Client Components

- **RSC** используются для страниц, layout, данных (prefetch через `trpc` из `lib/trpc/server`)
- **Client Components** помечены `'use client'` и используют `trpc` из `lib/trpc/client`
- Корневой `layout.tsx` — RSC, оборачивает в `TRPCProvider` + `HydrateClient`

### Состояние

- **Анонимные данные** (корзина, избранное) — Jotai + `atomWithStorage` (localStorage) в `lib/store/anonymous.ts`
- **Авторизованные данные** — tRPC + TanStack Query (кэширование, инвалидация)
- **Миграция** — при входе/регистрации анонимные данные автоматически мигрируют через `anonymous.migrateToUser`

### Импорт изображений

Next.js Image настроен для:
- Локальных изображений (через `localPatterns`)
- S3/MinIO (через `remotePatterns`, динамически из `STORAGE_ENDPOINT` и `STORAGE_PUBLIC_URL`)
- AWS S3 (любой регион)
- SVG разрешены (`dangerouslyAllowSVG: true`)

---

## Стиль кода и конвенции

### TypeScript

- Строгий режим (`strict: true`)
- `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`
- МодульResolution: `bundler`

### ESLint

Конфиг в `eslint.config.mjs`:
- База: `eslint-config-next` (core-web-vitals + typescript)
- Доступность: `jsx-a11y/*` правила на уровне `warn`
- **Запрет импорта моков в production-код:** `@/shared/mocks/*` запрещены вне тестов и сидов

### Tailwind CSS 4

- Конфигурация через CSS (нет `tailwind.config.ts`)
- Кастомная дизайн-система **Noir Ligne** с токенами `--nl-*`
- CSS-переменные для light/dark тем
- Основной шрифт: Chiron GoRound TC WS
- Большое количество кастомных utility-классов для mobile-first адаптации

### shadcn/ui

- Реестр: `radix-nova`
- Компоненты в `shared/ui/` и `components/ui/`
- Иконки: lucide-react

### Комментарии

- Кодовая база преимущественно на русском языке (комментарии, сообщения об ошибках, UI-тексты)
- Новые комментарии и пользовательские сообщения должны быть на русском

---

## Тестирование

### Vitest

Конфиг: `vitest.config.ts`
- Environment: `node`
- Паттерны: `__tests__/**/*.test.ts`, `tests/**/*.test.ts`

Пример существующих тестов (`__tests__/seo-and-security.test.ts`):
- Валидация webhook URL (блокировка localhost, private IPs, non-http)
- Генерация SEO-метаданных для товаров, категорий, страниц

### Playwright

Установлен как devDependency, конфигурация не обнаружена в корне.

### Запуск тестов

```bash
npm run test        # однократный запуск
npm run test:watch  # watch mode
```

---

## Переменные окружения

Копировать `.env.example` → `.env` и заполнить:

**Обязательные:**
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — секрет для подписи сессий (`openssl rand -hex 32`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` — публичный URL приложения

**Опциональные:**
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — OAuth GitHub
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Google
- `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET_NAME` — S3/MinIO
- `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` — мониторинг ошибок
- `FIREBASE_SERVER_KEY`, `VAPID_*` — push-уведомления

---

## Деплой

### Vercel (рекомендуется)

1. Импортировать репозиторий
2. Добавить env-переменные в Settings
3. Применить миграции: `npx prisma migrate deploy`
4. Опционально: `npx prisma db seed`

### Docker

Dockerfile описан в `docs/deployment.md` (multi-stage: builder → runner, standalone output).

### VPS / Linux

- Node.js 20+
- `npm ci` → `npx prisma migrate deploy` → `npm run build` → `npm run start`
- Рекомендуется PM2 для production

### Перед каждым деплоем

```bash
npx prisma migrate deploy
```

---

## Безопасность

1. **Аутентификация:** better-auth с cookie-based сессиями. Поддержка Bearer-токена и `X-Session-Token` для desktop/mobile.
2. **Авторизация:** ролевая модель (USER / EDITOR / ADMIN) на уровне tRPC-процедур.
3. **Rate limiting:** в middleware для upload, auth и search эндпоинтов.
4. **CORS:** строгая проверка origin для API-роутов.
5. **Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy (в `next.config.ts`).
6. **Валидация URL:** webhook URL валидируются на предмет localhost, private IPs, metadata endpoints.
7. **Запрет моков:** ESLint блокирует импорт `@/shared/mocks/*` в production-коде.
8. **SVG:** `dangerouslyAllowSVG: true` с CSP для изображений.

---

## Дополнительные заметки для агентов

- **Next.js 16** — читай актуальную документацию в `node_modules/next/dist/docs/`. Многие API отличаются от Next.js 14/15.
- **Prisma 7** — использует `prisma.config.ts`, адаптер Neon.
- **Zod v4** — синтаксис может отличаться от v3.
- **Tailwind CSS 4** — конфигурация через CSS, нет классического `tailwind.config.ts`.
- **Desktop и Mobile** — отдельные приложения со своими `package.json`. Они подключаются к тому же tRPC API и используют тот же better-auth (через токены).
- **Анонимная сессия** — не путать с `better-auth` сессией. Это отдельная сущность `AnonymousSession` в БД (или localStorage на клиенте), которая мигрирует при входе.
- **Page Sections** — CMS-страницы (`Page`) используют блочную систему секций (`Section`) для гибкой компоновки контента.
- **Home Sections** — главная страница (`/`) собирается из `HomeSection` с разными `SectionType`.
