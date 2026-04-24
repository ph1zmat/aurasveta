# Полный план развертывания приложения Aurasveta на VPS

Этот документ объединяет все предыдущие инструкции в один пошаговый чек-лист.  
Он охватывает начальную настройку сервера, базу данных, деплой приложения, безопасность, домен и HTTPS, а также объясняет нюансы с переменными окружения.

## 0. Предварительные требования

- VPS с Ubuntu 22.04/24.04 (рекомендуется)
- У вас есть пользователь с `sudo` (не `root`)
- Подготовлен домен (опционально)
- У вас есть доступ к исходному коду проекта (Git-репозиторий)

**Важное предупреждение по безопасности:**  
После обсуждения в открытых каналах все фигурировавшие секреты (пароли БД, ключи VAPID, MINIO и др.) считаются скомпрометированными. В production используйте **новые уникальные значения**.

## 1. Основные принципы работы с переменными окружения

Переменные, заданные через `export` в терминале, **живут только в текущей сессии**.  
После перезахода по SSH или перезагрузки они сбрасываются.

**Что нужно запомнить:**

- Для удобства при ручной работе используйте `~/.bashrc` (только несекретные значения).
- Секретные переменные (пароли, ключи) храните в файле `.env.production` проекта.
- Для `systemd`-сервисов используйте `EnvironmentFile=` в unit-файле.

**Рекомендуемая практика:**

- В `~/.bashrc` добавить только «навигационные» переменные: `APP_NAME`, `APP_DIR`, `DEPLOY_USER`, `SERVER_IP`.
- Все секреты и конфигурацию приложения прописывать в `/var/www/aurasveta/current/.env.production`.

Пример добавления в `~/.bashrc` (на ваше усмотрение):

```bash
echo 'export APP_NAME="aurasveta"' >> ~/.bashrc
echo 'export APP_DIR="/var/www/aurasveta"' >> ~/.bashrc
echo 'export DEPLOY_USER="$(whoami)"' >> ~/.bashrc
echo 'export SERVER_IP="YOUR_PUBLIC_IP"' >> ~/.bashrc
source ~/.bashrc
```

## 2. Подготовка сервера

Подключитесь по SSH и выполните:

```bash
ssh your_user@YOUR_SERVER_IP
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y curl wget git unzip ca-certificates gnupg lsb-release \
  ufw fail2ban nginx postgresql postgresql-contrib
```

Проверьте, что сервисы работают:

```bash
sudo systemctl enable --now postgresql nginx fail2ban
sudo systemctl status postgresql nginx fail2ban --no-pager
```

---

## 3. Настройка PostgreSQL

### 3.1. Создание пользователя и базы

Установите переменные (в текущей сессии):

```bash
export DB_NAME="aurasveta_db"
export DB_USER="aurasveta_user"
export DB_PASSWORD="STRONG_DB_PASSWORD"
```

Создайте базу:

```bash
sudo -u postgres psql <<EOF
CREATE ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';
CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
\c ${DB_NAME}
ALTER SCHEMA public OWNER TO ${DB_USER};
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF
```

### 3.2. Проверка локального подключения

Убедитесь, что PostgreSQL слушает локальные соединения:

```bash
sudo -u postgres psql -c "SHOW listen_addresses;"
# Ожидается: localhost
sudo ss -ltnp | grep 5432
# Должен быть 127.0.0.1:5432 или ::1:5432
```

Протестируйте TCP-подключение:

```bash
PGPASSWORD="${DB_PASSWORD}" psql -h 127.0.0.1 -U "${DB_USER}" -d "${DB_NAME}" -c "SELECT 1;"
```

**Никогда не открывайте порт 5432 наружу (UFW/cloud firewall).**
Приложение будет работать с БД через `127.0.0.1`.

---

## 4. Подготовка директории проекта

```bash
export APP_DIR="/var/www/aurasveta"
export DEPLOY_USER="$(whoami)"

sudo install -d -o "${DEPLOY_USER}" -g www-data -m 775 "${APP_DIR}"
sudo install -d -o "${DEPLOY_USER}" -g www-data -m 775 "${APP_DIR}/current"
sudo install -d -o "${DEPLOY_USER}" -g www-data -m 775 "${APP_DIR}/shared"
sudo install -d -o "${DEPLOY_USER}" -g www-data -m 775 "${APP_DIR}/logs"

# Устанавливаем SGID бит, чтобы новые файлы наследовали группу
sudo chmod g+s "${APP_DIR}" "${APP_DIR}/current" "${APP_DIR}/shared" "${APP_DIR}/logs"
```

Проверьте права:

```bash
ls -ld "${APP_DIR}" "${APP_DIR}/current" "${APP_DIR}/shared" "${APP_DIR}/logs"
```

---

## 5. Установка Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
node -v && npm -v
```

---

## 6. Развертывание кода и Production-окружение

### 6.1. Клонирование репозитория

```bash
cd "${APP_DIR}/current"
git clone YOUR_REPOSITORY_URL .
npm ci
```

### 6.2. Создание `.env.production`

**Никогда не копируйте dev `.env` один в один!** Создайте отдельный файл.

Ниже два варианта – выберите один.

#### Вариант A: Локальный PostgreSQL на VPS

```bash
cat > .env.production <<EOF
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}"

NEXT_PUBLIC_BETTER_AUTH_URL="http://YOUR_SERVER_IP"
NEXT_PUBLIC_APP_URL="http://YOUR_SERVER_IP"
BETTER_AUTH_SECRET="$(openssl rand -hex 32)"

GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

VAPID_PUBLIC_KEY=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""

STORAGE_ENDPOINT="http://127.0.0.1:9000"
STORAGE_REGION="us-east-1"
STORAGE_ACCESS_KEY="CHANGE_ME_MINIO_ACCESS_KEY"
STORAGE_SECRET_KEY="CHANGE_ME_MINIO_SECRET_KEY"
STORAGE_BUCKET_NAME="aurasveta"
STORAGE_FORCE_PATH_STYLE="true"
STORAGE_PRESIGN_TTL="3600"
EOF
```

#### Вариант B: База данных в Neon (облачная)

```bash
cat > .env.production <<EOF
NODE_ENV=production
PORT=3000

DATABASE_URL="postgresql://YOUR_NEON_USER:YOUR_NEON_PASSWORD@YOUR_NEON_HOST/YOUR_DB?sslmode=verify-full&channel_binding=require"

NEXT_PUBLIC_BETTER_AUTH_URL="http://YOUR_SERVER_IP"
NEXT_PUBLIC_APP_URL="http://YOUR_SERVER_IP"
BETTER_AUTH_SECRET="$(openssl rand -hex 32)"

# Остальное аналогично варианту A...
EOF
```

**Объяснение ключевых переменных:**

- `NEXT_PUBLIC_BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` – должны указывать на ваш публичный IP (пока без домена) или домен.
- `BETTER_AUTH_SECRET` – генерируется новый, длиной 64 символа.
- `DATABASE_URL` – пароль в URL **обязан** совпадать с реальным паролем роли PostgreSQL (`${DB_USER}` / `DB_USER`). Если они расходятся, Prisma будет падать с `P1000`.
- `STORAGE_*` – обязательны, иначе загрузка файлов не будет работать.
- `VAPID_*` – если push-уведомления не нужны, можно оставить пустыми, но тогда учтите, что часть функционала выключится.

### 6.2.1. Обязательная проверка `.env.production` перед первым запуском

Сразу после создания файла проверьте, что строка подключения действительно рабочая:

```bash
cd "${APP_DIR}/current"
set -a; source .env.production; set +a
psql "$DATABASE_URL" -c "SELECT current_user, current_database();"
```

Если видите `password authentication failed` или Prisma позже падает с `P1000`, значит пароль в `DATABASE_URL` не совпадает с паролем роли в PostgreSQL. Исправьте либо `.env.production`, либо саму роль:

```bash
sudo -u postgres psql -c "ALTER ROLE ${DB_USER} WITH LOGIN PASSWORD '${DB_PASSWORD}';"
psql "$DATABASE_URL" -c "SELECT current_user, current_database();"
```

### 6.2.2. Настройка S3-хранилища hoster.by

Если вы хотите использовать объектное хранилище hoster.by вместо локального MinIO, приложение `Aurasveta` уже готово к этому: в коде используются стандартные переменные `STORAGE_*` для S3-совместимого хранилища.

#### Шаг 1. Получите ключи доступа в личном кабинете hoster.by

1. Авторизуйтесь в личном кабинете hoster.by.
2. Перейдите в раздел **«Облачные решения»** или **«Объектное хранилище S3»**.
3. Откройте вкладку **«Ключи S3»**.
4. Нажмите **«Добавить ключ»** / **«Создать ключ»**.
5. Задайте понятное имя, например `aurasveta-storage-key`.
6. Сразу сохраните `Access Key ID` и `Secret Access Key` в безопасное место.

> Секретный ключ обычно показывается только один раз. Если потеряете его, придётся выпустить новый.

#### Шаг 2. Найдите endpoint вашего хранилища

В личном кабинете hoster.by найдите endpoint вашего object storage. Обычно встречаются варианты:

- `https://s3.hoster.by`
- `https://storage-id.s3.hoster.by`

Для проекта используйте **endpoint именно вашего хранилища**, то есть формат вроде:

```bash
https://YOUR_STORAGE_ID.s3.hoster.by
```

#### Шаг 3. Обновите `.env.production`

Откройте production-конфиг:

```bash
sudo nano /var/www/aurasveta/current/.env.production
```

Найдите и замените storage-настройки на значения от hoster.by:

```dotenv
STORAGE_ENDPOINT="https://YOUR_STORAGE_ID.s3.hoster.by"
STORAGE_REGION="us-east-1"
STORAGE_ACCESS_KEY="YOUR_ACCESS_KEY_ID"
STORAGE_SECRET_KEY="YOUR_SECRET_ACCESS_KEY"
STORAGE_BUCKET_NAME="YOUR_BUCKET_NAME"
STORAGE_FORCE_PATH_STYLE="true"
STORAGE_PRESIGN_TTL="3600"

# Необязательно: если будет отдельный публичный CDN/домен для файлов,
# можно указать его здесь. Иначе оставьте переменную пустой или не задавайте.
# STORAGE_PUBLIC_URL="https://cdn.example.com"
```

Пояснения:

- `STORAGE_ENDPOINT` — endpoint именно вашего S3-хранилища в hoster.by.
- `STORAGE_REGION` — обычно `us-east-1`, но если в панели hoster.by указан другой регион (например `ru-1`), используйте значение из панели.
- `STORAGE_FORCE_PATH_STYLE="true"` — оставьте включённым, если hoster.by для вашего хранилища требует path-style доступ.
- `STORAGE_BUCKET_NAME` — имя бакета, заранее созданного в личном кабинете.
- `STORAGE_PUBLIC_URL` — опционально; в коде проекта поддерживается, но нужен только если у файлов есть постоянный публичный URL/CDN.

#### Шаг 4. Примените изменения

После редактирования перезапустите приложение:

```bash
sudo systemctl restart aurasveta
sudo systemctl status aurasveta --no-pager
```

#### Шаг 5. Проверьте логи и загрузку файлов

Сразу после рестарта проверьте логи:

```bash
journalctl -u aurasveta -n 100 --no-pager
```

Если настройка корректна, не должно быть ошибок вида:

- `AccessDenied`
- `InvalidAccessKeyId`
- `SignatureDoesNotMatch`
- `NoSuchBucket`

Затем протестируйте загрузку изображения или файла через интерфейс сайта.

#### Шаг 6. Дополнительная ручная проверка через AWS CLI (опционально)

Для диагностики можно установить AWS CLI и проверить доступ к бакету напрямую:

```bash
sudo apt update && sudo apt install -y awscli
aws configure set aws_access_key_id "YOUR_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "YOUR_SECRET_ACCESS_KEY"
aws configure set region "us-east-1"
aws s3 ls s3://YOUR_BUCKET_NAME --endpoint-url="https://YOUR_STORAGE_ID.s3.hoster.by"
```

Если команда выполняется без ошибок и показывает содержимое бакета (или пустой список), значит endpoint, бакет и ключи настроены корректно.

#### Практическая заметка

Если вы переходите с локального MinIO на hoster.by S3, менять код приложения не нужно — достаточно обновить переменные `STORAGE_*` в `.env.production` и перезапустить сервис `aurasveta`.

### 6.3. Применение миграций и сборка

```bash
cd "${APP_DIR}/current"
set -a; source .env.production; set +a
npx prisma migrate deploy
# если есть сиды:
# npx prisma db seed
npm run build
```

---

## 7. Создание systemd-сервиса

Создайте файл `/etc/systemd/system/aurasveta.service`:

```bash
sudo tee /etc/systemd/system/aurasveta.service >/dev/null <<EOF
[Unit]
Description=Aurasveta web application
After=network.target postgresql.service

[Service]
Type=simple
User=${DEPLOY_USER}
Group=www-data
WorkingDirectory=${APP_DIR}/current
Environment=NODE_ENV=production
Environment=PORT=3000
EnvironmentFile=${APP_DIR}/current/.env.production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
```

Запустите и проверьте:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now aurasveta
sudo systemctl status aurasveta --no-pager
journalctl -u aurasveta -n 50 --no-pager
```

Проверьте локальный ответ:

```bash
curl -I http://127.0.0.1:3000
```

---

## 8. Настройка Nginx

### 8.1. Конфигурация reverse proxy

```bash
sudo tee /etc/nginx/sites-available/aurasveta >/dev/null <<'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
EOF
```

Активируйте:

```bash
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/aurasveta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Проверьте доступность сайта по IP:

```bash
curl -I http://YOUR_SERVER_IP
# В браузере: http://YOUR_SERVER_IP
```

Если получаете 502 – значит приложение не запущено или не слушает порт 3000.

---

## 9. Безопасность: UFW и fail2ban

### 9.1. Настройка брандмауэра

Откройте только нужные порты:

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status verbose
```

**Проверьте правила облачного фаервола вашего провайдера** – они не должны блокировать эти порты.

### 9.2. Fail2ban для SSH

Создайте базовый конфиг:

```bash
sudo tee /etc/fail2ban/jail.local >/dev/null <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
port = 22
backend = systemd
EOF

sudo systemctl restart fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

---

## 10. Комплексная проверка

Выполните финальную диагностику:

```bash
# Статусы всех сервисов
sudo systemctl status postgresql nginx fail2ban --no-pager
sudo systemctl status aurasveta --no-pager

# Локальное подключение к БД
PGPASSWORD="STRONG_DB_PASSWORD" psql -h 127.0.0.1 -U aurasveta_user -d aurasveta_db -c "SELECT 1;"

# Проверка сайта
curl -I http://YOUR_SERVER_IP

# Логи приложения (если есть ошибки)
journalctl -u aurasveta -n 100 --no-pager
```

---

## 11. Привязка домена и HTTPS

### 11.1. Настройка DNS

У регистратора создайте A-записи:

- `example.com` → `YOUR_SERVER_IP`
- `www.example.com` → `YOUR_SERVER_IP`

Проверьте обновление DNS:

```bash
dig +short example.com
dig +short www.example.com
```

### 11.2. Обновите Nginx

Поменяйте `server_name`:

```bash
sudo sed -i 's/server_name _;/server_name example.com www.example.com;/' /etc/nginx/sites-available/aurasveta
sudo nginx -t
sudo systemctl reload nginx
```

### 11.3. Установите Certbot

```bash
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 11.4. Получите сертификаты

```bash
sudo certbot --nginx -d example.com -d www.example.com
```

Проверьте автообновление:

```bash
sudo certbot renew --dry-run
```

### 11.5. Обновите `.env.production`

Теперь, когда сайт работает по HTTPS, замените URL:

```bash
cd /var/www/aurasveta/current
sed -i 's|http://YOUR_SERVER_IP|https://example.com|g' .env.production
# Также обновите NEXT_PUBLIC_APP_URL вручную, если нужно
sudo systemctl restart aurasveta
```

Проверьте, что приложение перезапустилось без ошибок.

---

## 12. Итоговый чек-лист готовности

- [ ] Сервер обновлен, установлены все пакеты
- [ ] PostgreSQL работает, локальное подключение проверено
- [ ] Директория проекта создана с правильными правами
- [ ] Node.js установлен, зависимости установлены, приложение собрано
- [ ] Создан `.env.production` с актуальными URL и секретами
- [ ] Миграции Prisma применены без ошибок
- [ ] Systemd-сервис `aurasveta` работает и перезапускается
- [ ] Nginx корректно проксирует запросы на порт 3000
- [ ] UFW разрешает порты 22, 80, 443
- [ ] Fail2ban защищает SSH
- [ ] Сайт открывается по IP и возвращает 200
- [ ] Домен привязан, HTTPS работает, `certbot renew` проходит
- [ ] После привязки домена обновлены публичные URL в .env.production

---

## Частые ошибки и их решение

1. **Сайт не открывается, хотя Nginx запущен** – проверьте облачный файрвол провайдера, используйте `curl` локально.
2. **Nginx возвращает 502** – приложение не запущено или не слушает `127.0.0.1:3000`. Смотрите `journalctl -u aurasveta`.
3. **Prisma не может подключиться к БД** – используйте тест: `psql -h 127.0.0.1 -U ...`.
4. **Ошибка аутентификации (password authentication failed) / Prisma `P1000`** – пароль в `DATABASE_URL` не совпадает с реальным паролем роли PostgreSQL. Сначала проверьте `psql "$DATABASE_URL" -c "SELECT 1;"`, затем при необходимости синхронизируйте пароль роли командой `ALTER ROLE ... WITH PASSWORD ...`.
5. **Сразу после `systemctl restart aurasveta` видите 502** – это может быть краткий момент, пока `next start` ещё поднимается. Если через несколько секунд 502 не исчезает, смотрите `journalctl -u aurasveta` и `curl -I http://127.0.0.1:3000`.
6. **Логин на сайте не работает / редирект на localhost** – неверно заданы `NEXT_PUBLIC_BETTER_AUTH_URL` и `NEXT_PUBLIC_APP_URL`. Они должны указывать на реальный публичный домен/IP.
7. **Загрузка файлов не работает** – отсутствуют или неверны переменные `STORAGE_*`.
8. **hoster.by S3 отвечает ошибками `AccessDenied`, `InvalidAccessKeyId`, `SignatureDoesNotMatch` или `NoSuchBucket`** – проверьте `STORAGE_ENDPOINT`, регион, имя бакета, ключи доступа и при необходимости выполните тест через `aws s3 ls ... --endpoint-url=...`.

```

```
