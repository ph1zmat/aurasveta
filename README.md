# Аура Света — интернет-магазин освещения

E-commerce платформа на Next.js 16 с SSR, tRPC API, Prisma ORM и better-auth.

## Стек технологий

| Слой         | Технология                                                |
| ------------ | --------------------------------------------------------- |
| Framework    | Next.js 16.2 (App Router, Turbopack)                      |
| API          | tRPC v11 (httpBatchStreamLink, superjson)                 |
| ORM          | Prisma 7 + NeonDB PostgreSQL                              |
| Auth         | better-auth v1.5 (email/password, GitHub, Google)         |
| State        | Jotai (анонимная корзина/избранное), TanStack React Query |
| UI           | Tailwind CSS 4, shadcn/ui, Recharts                       |
| Architecture | Feature-Sliced Design (FSD)                               |

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Настроить переменные окружения
cp .env.example .env
# Заполнить DATABASE_URL, BETTER_AUTH_SECRET и др.

# 3. Применить миграции и заполнить БД
npx prisma migrate deploy
npx prisma db seed

# 4. Запустить dev-сервер
npm run dev
```

## Переменные окружения

| Переменная                                  | Описание                              |
| ------------------------------------------- | ------------------------------------- |
| `DATABASE_URL`                              | URL подключения к PostgreSQL (NeonDB) |
| `BETTER_AUTH_SECRET`                        | Секрет для подписи сессий             |
| `NEXT_PUBLIC_BETTER_AUTH_URL`               | Публичный URL приложения              |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | OAuth GitHub (необяз.)                |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | OAuth Google (необяз.)                |

## Структура проекта (FSD)

```
app/              — маршруты Next.js (pages, layouts, API routes)
entities/         — бизнес-сущности (product, category, cart, spec)
features/         — пользовательские фичи (cart, favorites, catalog-filter, compare)
widgets/          — компоновочные виджеты (header, footer, navigation)
shared/           — переиспользуемые UI, утилиты, типы, моки
lib/              — инфраструктура (prisma, auth, trpc, store)
prisma/           — схема и миграции
```

## Основные маршруты

| Маршрут               | Описание                                     |
| --------------------- | -------------------------------------------- |
| `/`                   | Главная страница                             |
| `/catalog`            | Каталог товаров                              |
| `/catalog/[slug]`     | Категория                                    |
| `/product/[slug]`     | Карточка товара                              |
| `/cart`               | Корзина                                      |
| `/favorites`          | Избранное                                    |
| `/compare`            | Сравнение                                    |
| `/pages/[slug]`       | Контентные страницы (О нас, Доставка и т.д.) |
| `/login`, `/register` | Авторизация                                  |
| `/admin/*`            | Админ-панель                                 |
| `/api/trpc/*`         | tRPC API                                     |
| `/api/auth/*`         | better-auth API                              |

## Команды

```bash
npm run dev          # Запуск dev-сервера
npm run build        # Production-сборка
npm run start        # Запуск production
npx prisma studio    # GUI для базы данных
npx prisma db seed   # Заполнить БД тестовыми данными
```

## Авторизация и анонимные данные

- Анонимные пользователи: корзина и избранное хранятся в localStorage (Jotai atomWithStorage)
- При входе/регистрации анонимные данные автоматически мигрируют в аккаунт пользователя через `anonymous.migrateToUser`
- Админ-панель защищена через Proxy (middleware) — перенаправление на `/login` без сессии

## Деплой

См. [docs/deployment.md](docs/deployment.md).

## Документация по новой админке

- [Старт миграции на TanStack-first admin (Фазы 0–1)](docs/admin-tanstack-migration.md)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
