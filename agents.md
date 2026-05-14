<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# agents.md — Аура Света

Файл для AI-агентов. В проекте используется **русский язык** в комментариях, документации и пользовательских сообщениях.

---

## Обзор проекта

**Аура Света** — интернет-магазин освещения (люстры, светильники, бра). Это монорепозиторий, содержащий:

- **Веб-приложение** (основное) — Next.js 16 App Router с SSR/SSG, расположено в корне репозитория
- **Десктоп CMS** — Electron-приложение в `desktop/` (отдельный package.json, Vite + Electron Builder)
- **Мобильное приложение** — Expo / React Native в `mobile/` (отдельный package.json)

Веб-приложение реализует каталог товаров, корзину, избранное, сравнение, CMS-страницы с секциями, админ-панель с аналитикой, импорт/экспорт CSV, управление вебхуками, SEO-метаданными, push-уведомлениями и политиками магазина (доставка, возврат, гарантия).

---

## Технологический стек

| Слой | Технология | Версия (из package.json) |
|---|---|---|
| Framework | Next.js | 16.2.4 (App Router, Turbopack) |
| React | React / React DOM | 19.2.4 |
| Language | TypeScript | 5.x (strict) |
| API | tRPC | 11.16.0 + superjson |
| ORM | Prisma | 7.6.0 + `@prisma/adapter-pg` (Neon) |
| Database | PostgreSQL | Serverless (NeonDB) |
| Auth | better-auth | 1.5.6 |
| State (client) | Jotai | 2.19.0 (анонимная корзина/избранное) |
| State (client) | TanStack React Query | 5.96.2 |
| UI | Tailwind CSS | 4.x |
| UI | shadcn/ui | реестр `radix-nova` |
| UI | radix-ui | 1.4.3 |
| Icons | lucide-react | 1.7.0 |
| Charts | Recharts | 3.8.1 |
| Forms | React Hook Form | 7.74.0 + Zod v4 (4.3.6) |
| Tables | TanStack React Table | 8.21.3 |
| Drag & Drop | @dnd-kit | core 6.3.1, sortable 10.0.0 |
| CSV | Papaparse | 5.5.3 |
| Storage | AWS S3 SDK | 3.x (совместимо с MinIO) |
| Push | web-push | 3.6.7 |
| Testing | Vitest | 4.1.3 + jsdom + `@testing-library/*` |
| E2E | Playwright | 1.59.1 |
| Desktop | Electron | 36 + Vite 6 |
| Mobile | Expo | 55 + React Native 0.83 |

---

## Структура проекта (FSD)

Проект использует **Feature-Sliced Design** (FSD). Правило зависимостей:

```
app/ → widgets/ → features/ → entities/ → shared/
```

```
app/                 — маршруты Next.js (pages, layouts, API routes, loading, error, not-found)
entities/            — бизнес-сущности: product, category, cart, spec, page-block
features/            — пользовательские фичи: cart, favorites, catalog-filter, compare, product-details, admin
widgets/             — компоновочные виджеты: header, footer, navigation, product-carousel, home-sections, page-renderer
shared/              — переиспользуемый UI, утилиты, типы, конфигурация
lib/                 — инфраструктура: prisma, auth, trpc, store, storage, seo, sections, push, utils
prisma/              — схема (schema.prisma), миграции, сиды (seed.ts, seedcatalog.ts)
scripts/             — TS-скрипты для миграций, бэкфилла SEO, конвертации изображений
packages/            — shared-admin (код, общий для админок web + desktop)
desktop/             — Electron CMS-приложение (отдельный package.json)
mobile/              — Expo/React Native приложение (отдельный package.json)
tools/               — @aurasveta/db-cli и другие внутренние инструменты
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

// ❌ Неправильно (нарушение инкапсуляции)
import ProductCard from '@/entities/product/ui/productcard'
```

Примечание: в текущей кодовой базе есть прямые импорты — это допустимо при рефакторинге, но новый код должен следовать правилу.

### Алиасы путей

`@/*` → корень проекта (`./*`).

Также есть алиас для shared-admin пакета:

```json
"@aurasveta/shared-admin": "./packages/shared-admin/src/index.ts"
"@aurasveta/shared-admin/*": "./packages/shared-admin/src/*"
```

---

## Основные маршруты

| Маршрут | Описание |
|---|---|
| `/` | Главная страница (секции HomeSection) |
| `/catalog` | Каталог товаров |
| `/catalog/[slug]` | Страница категории |
| `/product/[slug]` | Карточка товара |
| `/cart` | Корзина |
| `/favorites` | Избранное |
| `/compare` | Сравнение товаров |
| `/pages/[slug]` | CMS-страницы (О нас, Доставка и т.д.) |
| `/search` | Поиск |
| `/blog/[slug]` | Блог |
| `/login`, `/register` | Авторизация (группа `(auth)`) |
| `/admin/*` | Админ-панель (защищена прокси) |
| `/api/trpc/*` | tRPC API endpoint |
| `/api/auth/*` | better-auth endpoint |
| `/api/upload` | Загрузка файлов |
| `/api/storage/*` | S3/MinIO storage proxy |

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
npm run check:web              # guardrails + prisma:generate + lint + test + build

# Prisma
npm run prisma:generate        # Генерация клиента
npx prisma migrate dev         # Создать миграцию
npx prisma migrate deploy      # Применить миграции (production)
npx prisma db seed             # Заполнить тестовыми данными
npx prisma studio              # GUI для БД

# Сиды по группам
npm run seed:auth              # Пользователи и авторизация
npm run seed:policies          # Политики магазина
npm run seed:catalog           # Каталог (категории, товары)
npm run seed:content           # CMS-контент
npm run seed:integrations      # Интеграции
npm run seed:behavioral        # Поведенческие данные
npm run seed:core              # Все основные группы

# Скрипты
npm run convert:svg-to-webp             # Конвертация SVG в WebP
npm run guardrails:web                  # Проверка guardrails
npm run site-nav:migrate                # Миграция навигации (dry-run)
npm run site-nav:migrate:apply          # Миграция навигации (применить)
npm run seo:roadmap:backfill            # Бэкфилл SEO (dry-run)
npm run seo:roadmap:backfill:apply      # Бэкфилл SEO (применить)
npm run seo:smoke                       # Post-deploy SEO smoke tests
npm run seo:backfill-metadata           # Алиас для бэкфилла SEO
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
- `client.tsx` — TRPCProvider для клиентских компонентов
- `server.tsx` — хелперы для RSC (prefetch, hydration)
- `queryclient.ts` — фабрика QueryClient
- `routers/_app.ts` — корневой роутер, объединяющий все подроутеры

**Подроутеры (29 штук):**
`products`, `categories`, `properties`, `cart`, `favorites`, `orders`, `pages`, `profile`, `anonymous`, `admin`, `webhooks`, `search`, `seo`, `cms`, `shopSettings`, `settingsBusiness`, `notifications`, `importOperations`, `siteNav`, `shippingPolicy`, `returnPolicy`, `warrantyPolicy`, `compare`, `push`, `setting`, `sectionType`, `homeSection`, `recommendations`

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
- `trustedOrigins` включает localhost, production URL, desktop и mobile deeplink-схемы (`exp+auracms://`, `aurasveta://`)

Утилиты в `lib/auth/authutils.ts`: `getSession`, `requireAuth`, `requireAdmin`.

### Prisma

Схема в `prisma/schema.prisma` (30+ моделей):

**Пользователи и авторизация:**
- `User` — роли: USER, EDITOR, ADMIN
- `Session`, `Account`, `Verification` — better-auth

**Каталог:**
- `Category` — иерархия (parent/children), режимы MANUAL / FILTER
- `Product` — цена, бренд, badges, condition, поисковый вектор (`tsvector`)
- `ProductImage` — отдельная таблица для изображений товаров
- `Property` / `PropertyValue` — динамические свойства
- `ProductPropertyValue` — M:N связь товаров со свойствами

**Заказы и корзина:**
- `Cart` — привязана к User (JSON items)
- `AnonymousSession` — анонимная корзина/избранное (JSON), мигрирует при входе
- `Favorite` — избранные товары
- `CompareItem` — товары для сравнения
- `Order` / `OrderItem` — статусы: PENDING → PAID → SHIPPED → DELIVERED → CANCELLED

**CMS:**
- `Page` — контентные страницы с SEO-полями, статусы DRAFT / PUBLISHED / ARCHIVED
- `PageVersion` — версионирование контента
- `PageBlock` — блоки страниц
- `Section` / `SectionProduct` / `SectionCategory` / `SectionPageReference` / `SectionMediaItem` — секции страниц
- `HomeSection` / `SectionType` — секции главной страницы
- `MediaAsset` — медиа-ассеты
- `Setting` — ключ-значение настроек
- `StoreSettings` — настройки магазина (телефон, адрес, соцсети)

**Политики магазина:**
- `ShippingPolicy` — политики доставки
- `ReturnPolicy` — политики возврата
- `WarrantyPolicy` — политики гарантии

**SEO и аналитика:**
- `SeoMetadata` — SEO-метаданные для любых сущностей
- `ProductView` — просмотры товаров (рекомендательная система)
- `SearchQuery` — история поисковых запросов

**Уведомления:**
- `Webhook` — вебхуки на события
- `PushDevice` — устройства для push-уведомлений (FCM / WEB_PUSH)
- `Notification` — уведомления пользователей

**Импорт:**
- `ImportOperation` — журнал импортных операций

**Навигация:**
- `SiteNavItem` — элементы навигации (HEADER / FOOTER)

Prisma использует адаптер Neon (`@prisma/adapter-pg`) для serverless PostgreSQL. Конфигурация в `prisma.config.ts`.

### Прокси / middleware (`proxy.ts`)

Файл `proxy.ts` реализует защиту маршрутов и rate limiting (не `middleware.ts`):

- Защита `/admin/*` — редирект на `/login` без сессии
- Редирект авторизованных пользователей с `/login` и `/register` на `/`
- Canonical redirect: `www.aurasveta.by` → `aurasveta.by`
- CORS для API-роутов
- Rate limiting (in-memory, для single-instance):
  - `/api/upload` — 5 запросов/мин
  - `/api/trpc/auth.login`, `/api/trpc/auth.register` — 10 запросов/10мин
  - `/api/trpc/search` — 30 запросов/мин

### Storage (S3/MinIO)

Логика в `lib/storage.ts`:
- AWS S3 SDK с поддержкой path-style URL (MinIO)
- Presigned URLs для загрузки/скачивания
- API routes: `/api/upload`, `/api/upload/delete`, `/api/storage/file`, `/api/storage/signed-url`

Для локальной разработки S3 доступен через `docker-compose.yml` (MinIO на портах 9000/9001).

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

Next.js Image настроен в `next.config.ts` для:
- Локальных изображений (через `localPatterns`)
- S3/MinIO (через `remotePatterns`, динамически из `STORAGE_ENDPOINT` и `STORAGE_PUBLIC_URL`)
- AWS S3 (любой регион)
- SVG разрешены (`dangerouslyAllowSVG: true`) с CSP

### Tailwind CSS 4

- Конфигурация через CSS (`app/globals.css`), нет `tailwind.config.ts`
- PostCSS конфиг в `postcss.config.mjs` — плагин `@tailwindcss/postcss`
- Кастомная дизайн-система с CSS-переменными для light/dark тем
- Основной шрифт: Chiron GoRound TC WS
- shadcn/ui реестр: `radix-nova`, базовый цвет `neutral`

---

## Стиль кода и конвенции

### TypeScript

- Строгий режим (`strict: true`)
- `noUnusedLocals: true`, `noUnusedParameters: true`, `noImplicitReturns: true`
- `moduleResolution`: `bundler`
- `jsx`: `react-jsx`
- Исключённые из компиляции директории: `node_modules`, `.next`, `desktop`, `mobile`, `__mobile_audit__`, `tests`

### ESLint

Конфиг в `eslint.config.mjs`:
- База: `eslint-config-next` (core-web-vitals + typescript)
- Доступность: `jsx-a11y/*` правила на уровне `warn`
- Игнорируются `desktop/**` и `mobile/**`
- **Запрет импорта моков в production-код:** `@/shared/mocks/*` запрещены вне тестов, спеков и `prisma/seed.ts`

### shadcn/ui

- Компоненты в `shared/ui/` и `components/ui/`
- Иконки: lucide-react
- Алиасы: `@/components`, `@/components/ui`, `@/lib/utils`, `@/lib`, `@/hooks`

### Комментарии и UI-тексты

- Кодовая база преимущественно на русском языке
- Новые комментарии, сообщения об ошибках и UI-тексты должны быть на русском

---

## Тестирование

### Vitest

Конфиг: `vitest.config.ts`
- Environment: `node`
- Паттерны: `__tests__/**/*.test.ts`, `tests/**/*.test.ts`
- Setup файл: `tests/setup.ts` (подключает `@testing-library/jest-dom/vitest`)

**Структура тестов:**
- `__tests__/` — общие тесты (SEO, безопасность)
- `tests/unit/` — юнит-тесты (корзина, заказы, фильтры, поиск, SEO, админка, схемы, утилиты)
- `tests/integration/` — интеграционные тесты

**Примеры покрытых областей:**
- Валидация webhook URL (блокировка localhost, private IPs)
- Генерация SEO-метаданных для товаров, категорий, страниц
- Логика корзины и анонимной сессии
- Построение поисковых запросов и фильтров
- Схемы tRPC и Zod
- Админ-импорт/экспорт CSV
- Компоненты (ConfirmDialog, AdminPagination)

### Playwright

Установлен как devDependency. Конфигурация отсутствует в корне — используется для SEO smoke tests (`npm run seo:smoke`).

### Запуск тестов

```bash
npm run test        # однократный запуск
npm run test:watch  # watch mode
```

---

## CI/CD и деплой

### GitHub Actions

1. **SEO Quality Gate** (`.github/workflows/seo-quality-gate.yml`)
   - Запускается на pull request и вручную
   - Шаги: checkout → setup Node 20 → `npm ci` → lint → test → build → production server → SEO smoke checks
   - Smoke checks проверяют критичные для SEO endpoint'ы

2. **Deploy to VPS** (`.github/workflows/deployvps.yml`)
   - Запускается на push в `main` и вручную
   - SSH-деплой на VPS с файловым lock'ом
   - Шаги: git sync → load env → `npm install` → `prisma migrate deploy` → `next build --turbopack` → fix permissions → restart systemd service
   - Post-deploy проверки: smoke tests для `/`, `/catalog`, `/robots.txt`, `/sitemap.xml`, `/favicon.ico` + 404 contract check

### Деплой

**VPS (основной):**
- Node.js 20+
- Systemd-сервис `aurasveta.service`
- Код в `/var/www/aurasveta/current`
- Env-файл `.env.production` в корне проекта на сервере
- Сборка происходит на сервере через `next build --turbopack`
- Перед каждым деплоем: `npx prisma migrate deploy`

**Vercel:**
- Возможен, но не является основным production
- Требуется `npx prisma migrate deploy` после деплоя

**Локальный S3 (MinIO):**
- `docker-compose.yml` поднимает MinIO на `localhost:9000` (API) и `localhost:9001` (консоль)
- Одноразовый контейнер `minio-init` создаёт бакет `aurasveta` и публичный доступ

---

## Переменные окружения

Копировать `.env.example` → `.env` (локально) или `.env.production` (сервер) и заполнить:

**Обязательные:**
- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET` — секрет для подписи сессий (`openssl rand -hex 32`)
- `NEXT_PUBLIC_BETTER_AUTH_URL` — публичный URL приложения
- `NEXT_PUBLIC_APP_URL` — публичный URL приложения

**Опциональные:**
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — OAuth GitHub
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth Google
- `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET_NAME`, `STORAGE_FORCE_PATH_STYLE`, `STORAGE_PUBLIC_URL`, `STORAGE_PRESIGN_TTL`, `STORAGE_MAX_ATTEMPTS` — S3/MinIO
- `FIREBASE_SERVER_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` — push-уведомления
- `DESKTOP_API_PROXY_TARGET`, `VITE_DEV_SERVER_URL` — desktop app
- `VERCEL_URL` — Vercel helper

---

## Безопасность

1. **Аутентификация:** better-auth с cookie-based сессиями. Поддержка Bearer-токена и `X-Session-Token` для desktop/mobile.
2. **Авторизация:** ролевая модель (USER / EDITOR / ADMIN) на уровне tRPC-процедур.
3. **Rate limiting:** в `proxy.ts` для upload, auth и search эндпоинтов (in-memory, single-instance).
4. **CORS:** строгая проверка origin для API-роутов.
5. **Security headers:** X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy, Strict-Transport-Policy (в `next.config.ts`).
6. **Валидация URL:** webhook URL валидируются на предмет localhost, private IPs, metadata endpoints.
7. **Запрет моков:** ESLint блокирует импорт `@/shared/mocks/*` в production-коде.
8. **SVG:** `dangerouslyAllowSVG: true` с CSP для изображений.
9. **Robots:** страницы `/admin`, `/cart`, `/favorites`, `/compare`, `/search`, `/login`, `/register`, `/forbidden` отдают `X-Robots-Tag: noindex, nofollow`.

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
- **SEO** — в проекте развёрнута SEO-инфраструктура: `SeoMetadata`, SEO-роутер, sitemap, robots.txt, smoke tests, weekly triage. Изменения в роутах или метаданных должны учитывать SEO-проверки.
