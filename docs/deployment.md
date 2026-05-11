# Деплой Aurasveta

Документ фиксирует рабочую production-стратегию после инцидента 500/502 (май 2026).

## Ключевой вывод

Для текущего vps с ограниченной памятью нельзя рассчитывать на стабильный `next dev --webpack` на сервере.

Рекомендуемый путь для production:

1. Сборка `next build` локально или в CI.
2. Доставка готового `.next` артефакта на vps.
3. Запуск только через `next start` (systemd-сервис `aurasveta.service`).

## Требования

- Node.js 20+
- npm
- PostgreSQL
- настроенный `systemd` сервис `aurasveta`
- корректный `env.production` в `/var/www/aurasveta/current`

## Базовая схема деплоя на vps

1. Обновить код и зависимости.
2. Применить миграции БД (`prisma migrate deploy`).
3. Получить production build (`.next`) — локально или в CI.
4. Доставить артефакт на vps.
5. Заменить старый `.next`, проверить наличие `.next/BUILD_ID`.
6. Перезапустить `aurasveta.service`.
7. Проверить `LOCAL` и `DOMAIN` (коды 200).

Подробный пошаговый runbook: `docs/operations/manual-build-deploy.md`.

## Важные production-ограничения

- Не запускать production через `next dev`.
- Не смешивать Turbopack и webpack-режим без явного флага.
- `NODE_ENV` должен быть стандартным (`production` для прода).
- `DATABASE_URL` обязан быть доступен в окружении сервиса (`EnvironmentFile=env.production`).
- Если отсутствует `.next/BUILD_ID`, `next start` не поднимется.

## Миграции и переносы

- Миграции БД: `docs/operations/db-migration-neon-to-vps-postgres.md`
- Миграции объектного хранилища: `docs/operations/storage-migration-s3.md`

## Инцидент и разбор

Postmortem с симптомами/причинами/решением:

- `docs/operations/incident-2026-05-07-vps-500-502.md`
