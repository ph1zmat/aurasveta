# Feature-Sliced Design (FSD) — Руководство по архитектуре

## Структура проекта

```
├── app/                          # Next.js App Router (FSD: app + pages)
│   ├── layout.tsx                # Корневой layout
│   ├── globals.css               # Глобальные стили
│   ├── page.tsx                  # Главная страница
│   ├── cart/page.tsx             # Корзина
│   ├── catalog/page.tsx          # Каталог
│   ├── catalog/[slug]/page.tsx   # Страница категории
│   ├── product/[slug]/page.tsx   # Страница товара
│   ├── compare/page.tsx          # Сравнение
│   └── favorites/page.tsx        # Избранное
│
├── widgets/                      # Крупные составные UI-блоки
│   ├── header/                   # Шапка (Header, MobileHeader, TopBar, CatalogDropdown, MiniCart)
│   ├── footer/                   # Подвал (Footer)
│   ├── navigation/               # Навигация (CategoryNav, MobileBottomNav, MobileCatalogMenu)
│   ├── product-carousel/         # Карусель товаров
│   └── home-sections/            # Секции главной (HeroBanner, PopularCategories и т.д.)
│
├── features/                     # Пользовательские сценарии
│   ├── cart/                     # Управление корзиной (CartItem, CartSummary, CouponForm)
│   ├── catalog-filter/           # Фильтрация каталога (Sidebar, Filters, Pagination)
│   ├── product-details/          # Просмотр товара (Gallery, PriceBlock, Tabs, Specs)
│   ├── compare/                  # Сравнение товаров
│   └── favorites/                # Избранное
│
├── entities/                     # Бизнес-сущности
│   ├── product/                  # Товар (типы, адаптеры, сервис, карточки)
│   ├── category/                 # Категория (типы, сервис, дерево, карусель)
│   ├── cart/                     # Корзина (типы)
│   └── spec/                     # Характеристики (типы)
│
└── shared/                       # Переиспользуемые утилиты и UI-кирпичики
    ├── ui/                       # Button, Input, Card, Checkbox, Slider и т.д.
    ├── lib/                      # Утилиты (cn)
    ├── types/                    # Общие TypeScript-типы
    ├── mocks/                    # Мок-данные для разработки
    └── config/                   # Конфигурация (будущее)
```

## Правила зависимостей

```
app/ → widgets/ → features/ → entities/ → shared/
```

- **shared** — не импортирует ничего из вышележащих слоёв
- **entities** — импортирует только из `shared/`
- **features** — импортирует из `entities/` и `shared/`
- **widgets** — импортирует из `features/`, `entities/` и `shared/`
- **app/** — импортирует из любого слоя

## Структура слайса

Каждый слайс (папка внутри `entities/`, `features/`, `widgets/`) имеет:

```
feature-name/
├── ui/              # React-компоненты
├── model/           # Типы, хуки, стор, адаптеры
├── api/             # API-запросы
├── lib/             # Вспомогательные функции
└── index.ts         # Public API (обязательно)
```

## Public API

Каждый слайс экспортирует только через `index.ts`:

```typescript
// entities/product/index.ts
export type { Product } from './model/types'
export { toProductCardProps, toCatalogCardProps } from './model/adapters'
export { getAllProducts, getProductBySlug } from './api/productService'
export { default as ProductCard } from './ui/ProductCard'
export { default as CatalogProductCard } from './ui/CatalogProductCard'
```

**Правило:** импортировать из слайса можно только через `index.ts`:

```typescript
// ✅ Правильно
import { ProductCard } from '@/entities/product'

// ❌ Неправильно
import ProductCard from '@/entities/product/ui/ProductCard'
```

> Примечание: в текущей реализации используются прямые пути (`@/entities/product/ui/ProductCard`), что допустимо на этапе миграции. В будущем рекомендуется перейти на импорт через `index.ts`.

## Создание нового слайса

### 1. Определить слой

| Вопрос                                                             | Слой         |
| ------------------------------------------------------------------ | ------------ |
| Это базовый UI-элемент без бизнес-логики?                          | `shared/ui/` |
| Это бизнес-сущность (товар, категория, пользователь)?              | `entities/`  |
| Это пользовательский сценарий (добавить в корзину, отфильтровать)? | `features/`  |
| Это крупный составной блок из нескольких сущностей/фич?            | `widgets/`   |

### 2. Создать структуру

```bash
mkdir -p features/new-feature/{ui,model,api}
```

### 3. Создать `index.ts`

```typescript
// features/new-feature/index.ts
export { default as NewFeatureComponent } from './ui/NewFeatureComponent'
export { useNewFeature } from './model/useNewFeature'
```

### 4. Использовать в странице

```typescript
// app/some-page/page.tsx
import { NewFeatureComponent } from '@/features/new-feature'
```

## Перекрёстные импорты (@x)

Если два слайса одного слоя должны знать друг о друге (запрещено по умолчанию):

1. Создать файл `entities/user/@x/product.ts`
2. Ре-экспортировать нужное
3. В `entities/product` импортировать из `@/entities/user/@x/product`

В текущем проекте перекрёстных зависимостей между слайсами одного слоя нет.

## Навигация по типам

Все базовые типы определены в `shared/types/`:

| Файл                      | Типы                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| `shared/types/product.ts` | `Product`                                                                  |
| `shared/types/catalog.ts` | `Category`, `Subcategory`, `CategoryTreeItem`, `Tag`                       |
| `shared/types/cart.ts`    | `CartItemData`                                                             |
| `shared/types/specs.ts`   | `SpecItem`, `SpecRow`, `SpecGroup`, `CompareSpecRow`, `CompareSpecSection` |

Слой `entities` ре-экспортирует эти типы через свои `index.ts`, поэтому можно импортировать и оттуда:

```typescript
import type { Product } from '@/entities/product'
// или напрямую
import type { Product } from '@/shared/types/product'
```

## Алиас @

Алиас `@` настроен в `tsconfig.json` и указывает на корень проекта:

```json
{
	"compilerOptions": {
		"paths": {
			"@/*": ["./*"]
		}
	}
}
```
