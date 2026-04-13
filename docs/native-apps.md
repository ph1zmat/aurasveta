# Аура Света CMS — Нативные приложения

## Архитектура

```
aurasveta/
├── desktop/          ← Electron приложение (Windows/macOS/Linux)
├── mobile/           ← React Native приложение (Android)
├── packages/
│   └── shared-admin/ ← Общие типы и tRPC клиент
├── lib/push/         ← Серверная логика push-уведомлений
└── prisma/           ← Модель PushDevice (миграция 20260410_add_push_devices)
```

### Принципы подключения
- **Приложения НЕ подключаются к БД напрямую** — только через tRPC API
- Аутентификация через `better-auth` (email+password)
- Токен сессии хранится в защищённом хранилище ОС:
  - **Electron**: `electron-store` (зашифрованное хранилище)
  - **Android**: `expo-secure-store` (Android Keystore)

---

## Десктопное приложение (Electron)

### Установка и запуск

```bash
cd desktop
npm install
npm run dev       # Режим разработки (Vite + Electron)
```

### Сборка

```bash
# Windows (.exe)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.deb, .AppImage)
npm run build:linux
```

Сборки появятся в `desktop/release/`.

### Конфигурация

При первом запуске откроется экран входа. URL API по умолчанию: `https://aurasveta.ru`.
Изменить URL: **Настройки** → **URL API-сервера**.

### Push-уведомления (Electron)

Десктоп использует **polling** — каждые 30 секунд проверяет наличие новых заказов.
При обнаружении нового заказа показывается системное уведомление ОС (через `Notification` API Electron).
Клик по уведомлению переходит на страницу заказа.

---

## Мобильное приложение (React Native / Expo)

### Установка и запуск

```bash
cd mobile
npm install
npx expo start       # Запуск Metro bundler
npx expo run:android # Запуск на эмуляторе/устройстве
```

### Сборка APK

```bash
# Установить EAS CLI (если нет)
npm install -g eas-cli
eas login

# Сборка APK для тестирования
eas build --platform android --profile preview

# Сборка .aab для Google Play
eas build --platform android --profile production
```

### Push-уведомления (Android / FCM)

1. Создайте проект в [Firebase Console](https://console.firebase.google.com/)
2. Добавьте Android-приложение с пакетом `ru.aurasveta.cms`
3. Скачайте `google-services.json` и поместите в `mobile/`
4. Установите переменные окружения на сервере:
   ```
   FIREBASE_SERVER_KEY=ваш_серверный_ключ_firebase
   FIREBASE_PROJECT_ID=ваш_project_id
   ```

Токен FCM автоматически регистрируется на сервере через `trpc.push.register`.

---

## Серверные изменения

### Новая модель Prisma: `PushDevice`

```prisma
model PushDevice {
  id        String       @id @default(cuid())
  userId    String
  platform  PushPlatform  // FCM | WEB_PUSH
  token     String        @unique
  endpoint  String?
  p256dh    String?
  authKey   String?
  active    Boolean       @default(true)
  createdAt DateTime
  updatedAt DateTime
}
```

### Новые tRPC процедуры

| Процедура | Доступ | Описание |
|-----------|--------|----------|
| `push.register` | Авторизованный | Регистрация устройства для push |
| `push.unregister` | Авторизованный | Отключение устройства |
| `push.getMyDevices` | Авторизованный | Список устройств пользователя |

### Новый REST-эндпоинт

- `POST /api/push/notify` — ручная отправка push всем админам (только ADMIN)

### Автоматические push при создании заказа

В `orders.create` добавлен вызов `sendPushToAdmins()` после успешного создания заказа.
Отправка асинхронная — не блокирует ответ клиенту.

### Применение миграции

```bash
npx prisma migrate deploy
```

---

## Переменные окружения (сервер)

Добавьте в `.env`:

```env
# Push-уведомления (Firebase для Android)
FIREBASE_SERVER_KEY=ваш_серверный_ключ
FIREBASE_PROJECT_ID=ваш_project_id

# Push-уведомления (Web Push для десктопа, опционально)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@aurasveta.ru
```

Для генерации VAPID-ключей:
```bash
npx web-push generate-vapid-keys
```

---

## Безопасность

- ✅ Никаких учётных данных БД в клиентских приложениях
- ✅ HTTPS для всех запросов к API
- ✅ Токены хранятся в защищённых хранилищах ОС
- ✅ Автоматический выход при невалидном токене
- ✅ Проверка роли (ADMIN/EDITOR) при входе — обычные пользователи не допускаются
- ✅ Rate-limiting на сервере (middleware.ts)
- ⚠️ Для production Android: включите ProGuard/R8 в `android/app/build.gradle`

---

## Ограничения

1. **Загрузка изображений**: в текущей версии мобильного приложения нет UI для загрузки изображений товаров/категорий. Рекомендация: добавить `expo-image-picker` и загрузку через `POST /api/upload`.

2. **SEO-настройки**: страница SEO в мобильном приложении доступна через экран «Ещё», но полный редактор пока в виде placeholder. В десктопной версии — полная функциональность.

3. **Офлайн-режим**: кэширование через React Query (30 секунд staleTime). При отсутствии сети отображаются последние кэшированные данные. Полный офлайн-режим с LocalStorage sync — в будущей версии.

4. **Тёмная тема**: Electron — поддерживается через CSS-переменные (`.dark` класс). React Native — автоматически следует системной теме через `userInterfaceStyle: "automatic"`.
