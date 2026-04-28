# Новая админ-панель Aura Sveta — старт Фаз 0–1

Документ фиксирует текущий прогресс миграции админки на TanStack-first подход без отказа от `Next.js 16` в публичной части проекта.

## Что уже сделано

- Создана ветка `feature/new-admin-panel`.
- Подтверждена защита секции `/admin/*` через `middleware.ts` и серверные проверки доступа в layout/страницах.
- Зафиксирован инвентарь текущих admin-маршрутов:
  - `/admin`
  - `/admin/home-sections`
  - `/admin/products`
  - `/admin/categories`
  - `/admin/properties`
  - `/admin/pages`
  - `/admin/orders`
  - `/admin/import-export`
  - `/admin/webhooks`
  - `/admin/seo`
  - `/admin/settings`
- Добавлен foundation-набор TanStack-зависимостей для следующих фаз:
  - Table, Form, Router, Virtual, Store, Pacer, Hotkeys, Query Devtools, Router Devtools.
- Создан стартовый слой `packages/shared-admin/src/{ui/table,ui/form,hooks,utils}`.
- В `app/admin/layout.tsx` подключены `Query Devtools` для отладки админской секции в development.
- Выполнена первая пилотная миграция списка страниц:
  - новый tRPC endpoint `pages.getAdminList`
  - `PagesClient` переведён на `TanStack Table`
  - включены server-side поиск, сортировка и пагинация.
- Стартовала Фаза 2 по формам:
  - создан базовый form shell в `packages/shared-admin/src/ui/form`
  - product form вынесена в `app/admin/products/ProductFormModal.tsx`
  - форма товара переведена на `TanStack Form`
  - изображения и характеристики (`properties`) теперь живут внутри form state, без параллельного локального state
  - payload формы синхронизирован с текущим tRPC контрактом `products.create/update`
  - добавлены inline validation, верхний submit-alert и ассоциированные labels/inputs для product form
  - форма свойства вынесена в `app/admin/properties/PropertyFormModal.tsx` и тоже переведена на `TanStack Form`
  - `properties`-modal теперь использует автогенерацию slug, inline validation и shared form adapters из `shared-admin`
  - `CategoriesClient` больше не держит inline modal form: категория вынесена в `app/admin/categories/CategoryFormModal.tsx`
  - category form переведена на `TanStack Form` с поддержкой `MANUAL/FILTER` режимов, выбора свойства/значения и загрузки изображения
  - в `packages/shared-admin/src/ui/form` добавлены reusable adapters: `FormInput`, `FormTextarea`, `FormSelect`, `FormCheckbox`, `formStyles`
  - добавлен `useUnsavedChangesGuard` и подключён ко всем уже мигрированным формам (`products`, `properties`, `categories`)
  - Phase 2 по пилотным admin-формам закрыта полностью: формы товаров, свойств и категорий переведены на единый TanStack-first form stack

## Почему пилот начат со страниц

`/admin/pages` — самый безопасный кандидат для первой миграции:

- плоская структура данных;
- нет дерева, drag-and-drop и вложенных редакторов;
- есть понятные операции CRUD;
- не затрагивает сложную медиа-галерею товаров.

Это позволяет обкатать базовый table-kit и контракт серверных параметров перед переносом более сложных экранов (`orders`, `products`, `properties`).

## Новый контракт для server-driven таблиц

Пилотный endpoint `pages.getAdminList` принимает:

- `page`
- `pageSize`
- `search`
- `sortBy`
- `sortDir`

И возвращает:

- `items`
- `total`
- `page`
- `pageSize`
- `pageCount`

Этот контракт рекомендуется использовать как шаблон для следующих таблиц:

- `webhooks.getAdminList`
- `orders.getAdminList`
- `products.getAdminList`
- `properties.getAdminList`

## Следующие шаги Phase 1

1. Перевести `WebhooksClient` на тот же table-kit.
2. Перевести `OrdersClient` на server-driven TanStack Table.
3. Добавить column visibility, multi-select и сохранение search params.
4. Подключить `TanStack Virtual` для длинных списков товаров/заказов.
5. Начать вынос таблиц и форменных адаптеров в `packages/shared-admin`.

## Итог Phase 2

Phase 2 завершена для текущего пилотного объёма. Что входит в done:

1. Product, Property и Category modal forms переведены на `TanStack Form`.
2. Повторяющиеся form adapters вынесены в `packages/shared-admin`.
3. Добавлен и подключён `unsaved changes guard`.
4. Category form больше не живёт как большой inline-блок внутри `CategoriesClient`.

## Следующие шаги после Phase 2

1. Подготовить product/list экраны к интеграции с `TanStack Router` search state на Phase 3.
2. Определить, какие modal-driven editor'ы стоит переводить в route-driven режим.
3. Продолжить перенос table/list экранов (`orders`, `webhooks`, далее более тяжёлые admin-разделы).
4. Добавить более агрессивный optimistic UX там, где он действительно улучшит perceived performance без риска рассинхронизации.

## Итог Phase 3

Phase 3 завершена как route-driven слой для admin UI внутри текущего `Next.js App Router` boundary:

1. Добавлен общий admin URL-state hook `app/admin/hooks/useAdminSearchParams.ts`.
2. В `packages/shared-admin/src/utils/search-params.ts` расширены helpers для чтения enum/boolean params и безопасного merge query-state.
3. Экраны `pages`, `products`, `properties`, `orders`, `webhooks`, `categories` переведены на URL-driven state вместо локальных `useState` для ключевых list/detail/modal сценариев.
4. Поиск, пагинация, сортировка, открытие модалок и detail-view теперь восстанавливаются после reload и поддерживают deep-linking/Back navigation.
5. Route-driven editor policy зафиксирован в коде: UI остаётся modal-driven визуально, но open/selection state теперь живёт в URL.

### Что именно теперь сидит в URL

- `pages`: `search`, `page`, `sortBy`, `sortDir`, `create`, `edit`
- `products`: `search`, `category`, `brand`, `sort`, `inStock`, `page`, `create`, `edit`
- `properties`: `search`, `expand`, `addValue`, `create`, `edit`
- `orders`: `status`, `search`, `page`, `order`
- `webhooks`: `create`
- `categories`: `category`, `edit`, `create`, `parent`

## Следующие шаги после Phase 3

1. Перевести оставшиеся тяжёлые admin-секции на тот же URL-state contract.
2. При необходимости вынести current admin navigation на полноценный client-side router shell поверх уже подготовленного route-state слоя.
3. Добавить keyboard shortcuts / command palette поверх route-driven admin state.

## Итог Phase 4

Phase 4 завершена как закрытие оставшихся тяжёлых admin-сценариев на общем route-driven contract:

1. `HomeSectionsClient` переведён на URL-driven modal state для create/edit section и create type flows.
2. `SEO`-раздел переведён на URL-driven state для tab/search/pagination/modal сценариев.
3. В тяжёлых редакторах добавлена защита от потери несохранённых изменений (`home-sections`, `seo`).
4. Теперь оставшиеся сложные admin-экраны тоже поддерживают deep-linking, reload recovery и back/forward navigation без потери контекста.

### Что именно теперь сидит в URL после Phase 4

- `home-sections`: `create`, `edit`, `createType`, `typeComponent`
- `seo`: `tab`, `search`, `page`, `targetType`, `targetId`, `targetName`

## Следующие шаги после Phase 4

1. Добавить keyboard shortcuts / command palette поверх уже route-driven admin state.
2. При необходимости вынести current admin navigation на полноценный client-side router shell.
3. Продолжить точечную унификацию сложных редакторов (`home-sections`, `seo`) вокруг shared-admin modal/form primitives там, где это даст реальную окупаемость.

## Итог Phase 5

Phase 5 завершена как keyboard-first admin shell поверх уже собранного route-driven state:

1. Добавлен общий `admin` navigation contract в `app/admin/components/admin-nav.ts`, который теперь используется и sidebar, и command palette.
2. Внедрена глобальная `AdminCommandPalette` с быстрым поиском действий, навигации и route-aware create/focus сценариев.
3. Горячие клавиши подключены на `TanStack Hotkeys` core через `useAdminHotkeys`, а их живой список читается из `HotkeyManager` через `@tanstack/react-store`.
4. Для admin shell доступны cross-platform shortcuts вроде `Mod+K`, а также быстрые переходы и primary action для текущего экрана (`Alt+Shift+N`).
5. Command palette работает поверх уже существующего URL-contract: команды открывают те же modal/detail сценарии через query params, а не через отдельный параллельный state.

### Что именно добавлено на Phase 5

- глобальная command palette для `/admin/*`
- route-aware quick actions для `pages`, `products`, `categories`, `properties`, `home-sections`, `webhooks`, `orders`, `seo`
- keyboard shortcuts registry с отображением реальных зарегистрированных shortcuts в UI
- discoverability entrypoint в sidebar (`Command palette`, `Mod+K`)

## Следующие шаги после Phase 5

1. При необходимости вынести current admin navigation на полноценный client-side router shell поверх уже подготовленного route-state и command shell слоя.
2. Продолжить точечную унификацию сложных редакторов (`home-sections`, `seo`) вокруг shared-admin modal/form primitives там, где это даст реальную окупаемость.
3. При желании расширить shell до user-customizable shortcuts и sequence-команд, но это уже enhancement, а не blocker текущей миграции.

## Итог Phase 6

Phase 6 завершена как закрытие оставшихся legacy modal forms и выравнивание admin UX на едином shared-admin form stack:

1. `PageFormModal` вынесена из `PagesClient` в отдельный компонент и переведена на `TanStack Form` + shared-admin field adapters.
2. `WebhookFormModal` вынесена из `WebhooksClient` в отдельный компонент и тоже переведена на единый modal/form contract.
3. Для `pages` и `webhooks` добавлены submit-level ошибки, inline validation и `unsaved changes guard`, как и в ранее мигрированных формах товаров, свойств и категорий.
4. В форме страниц возвращён и улучшен доступ к техническим JSON-полям (`contentBlocks`, `seo`) через отдельный collapsible-блок вместо скрытого неуправляемого состояния.
5. `PagesClient` и `WebhooksClient` очищены от больших inline modal implementations и теперь работают как orchestration/list слои, а не как «всё-в-одном» компоненты.

### Что именно добавлено на Phase 6

- `app/admin/pages/PageFormModal.tsx`
- `app/admin/webhooks/WebhookFormModal.tsx`
- `app/admin/webhooks/webhook-config.ts`
- единый UX для modal forms: отдельный файл, `TanStack Form`, shared-admin inputs, submit alert, discard guard

## Следующие шаги после Phase 6

1. При необходимости добавить route-driven `edit` flow для `webhooks`, если раздел начнёт требовать полноценного редактирования, а не только create/test/delete.
2. Продолжить точечную унификацию тяжёлых редакторов (`home-sections`, `seo`) вокруг общего modal/form contract, если это снизит сложность без потери гибкости.
3. При желании вынести submit/error banner и modal action patterns в отдельные shared-admin primitives, чтобы убрать последние повторяющиеся куски UI-кода.

## Что пока осознанно не трогали

- DnD-ядро `HomeSectionsClient` и визуальный `SectionConfigEditor` оставлены в текущей архитектуре; на Phase 4 менялся route-driven orchestration layer, а не внутренняя модель конфиг-редактора.
