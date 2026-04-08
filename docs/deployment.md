# Деплой Аура Света

## Требования

- Node.js 20+
- PostgreSQL (рекомендуется NeonDB для serverless)
- npm или pnpm

## Vercel (рекомендуется)

### 1. Подключить репозиторий

- Зайти на [vercel.com](https://vercel.com)
- Импортировать Git-репозиторий
- Framework Preset: Next.js (определится автоматически)

### 2. Настроить переменные окружения

В Settings → Environment Variables добавить:

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=<сгенерировать: openssl rand -hex 32>
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.vercel.app

# Опционально: OAuth провайдеры
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

### 3. Настроить базу данных

```bash
# Применить миграции
npx prisma migrate deploy

# Заполнить тестовыми данными (опционально)
npx prisma db seed
```

### 4. Деплой

```bash
vercel --prod
```

Или настроить автодеплой при пуше в main.

## Docker (самостоятельный хостинг)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t aurasveta .
docker run -p 3000:3000 --env-file .env aurasveta
```

## VPS / Linux

```bash
# Склонировать и установить
git clone <repo-url> /opt/aurasveta
cd /opt/aurasveta
npm ci

# Настроить .env
cp .env.example .env
nano .env

# Подготовить БД
npx prisma migrate deploy
npx prisma db seed

# Собрать и запустить
npm run build
npm run start
```

Для production рекомендуется использовать PM2:

```bash
npm install -g pm2
pm2 start npm --name "aurasveta" -- start
pm2 save
pm2 startup
```

## Миграции БД при обновлении

```bash
# Перед каждым деплоем
npx prisma migrate deploy
```

## Мониторинг

- Vercel Analytics — встроено при деплое на Vercel
- Prisma Studio — `npx prisma studio` для просмотра данных
- PM2 Monitor — `pm2 monit` при использовании PM2
