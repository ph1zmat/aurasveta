# Мобильная адаптация — AuraSveta

## Брейкпоинты

| Токен | Ширина | Описание |
|-------|--------|----------|
| base  | 0–479px | Мобильные телефоны |
| `sm`  | ≥480px | Большие мобильные |
| `md`  | ≥768px | Планшеты |
| `lg`  | ≥1024px | Десктоп (малый) |
| `xl`  | ≥1280px | Десктоп (большой) |

Проект использует **Tailwind CSS 4** с подходом **mobile-first**: базовые стили пишутся для мобильных, модификаторы `sm:`, `md:`, `lg:` расширяют для больших экранов.

---

## Архитектура мобильной навигации

| Компонент | Видимость | Описание |
|-----------|-----------|----------|
| `TopBar` | `hidden md:block` | Верхняя инфополоса (телефон, адрес) |
| `Header` | `hidden md:block` | Основная шапка с поиском, иконками |
| `CategoryNav` | `hidden md:block` | Горизонтальная навигация по категориям |
| `MobileHeader` | `md:hidden` | Компактная шапка для мобильных |
| `MobileBottomNav` | `md:hidden` | Фиксированная нижняя панель навигации |
| `MobileCatalogMenu` | `md:hidden` | Полноэкранное мобильное меню каталога |
| `StickyProductHeader` | `hidden md:block` | Прилипающая шапка при скролле карточки товара |

---

## Общие паттерны

### Адаптивные отступы
```
py-6 md:py-8        — секции
py-4 md:py-6        — заголовки страниц
gap-4 md:gap-8      — колонки контента
```

### Адаптивная типографика
```
text-lg md:text-xl   — заголовки страниц (h1)
text-base md:text-lg  — заголовки секций
text-sm              — основной текст (неизменный)
```

### Адаптивные заголовки страниц
```tsx
<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
  <h1 className='text-lg font-bold uppercase tracking-wider md:text-xl'>
    Заголовок
  </h1>
  <Button variant='ghost'>Действие</Button>
</div>
```

### Горизонтальный скролл для узких контейнеров
```tsx
<div className='overflow-x-auto scrollbar-hide'>
  <div className='min-w-[700px] md:min-w-0'>
    {/* контент с фиксированными колонками */}
  </div>
</div>
```

---

## Компонент Slider — адаптивные карусели

Компонент `Slider` поддерживает проп `breakpoints` для адаптивного количества видимых слайдов:

```tsx
import { Slider, type SliderBreakpoint } from '@/components/ui'

const breakpoints: SliderBreakpoint[] = [
  { minWidth: 0,    visibleItems: 2, gap: 8  },
  { minWidth: 480,  visibleItems: 3, gap: 12 },
  { minWidth: 768,  visibleItems: 4, gap: 16 },
  { minWidth: 1024, visibleItems: 6, gap: 24 },
]

<Slider breakpoints={breakpoints} visibleItems={6} gap={24}>
  {items}
</Slider>
```

`breakpoints` имеет приоритет над `visibleItems` / `gap`. Если `breakpoints` не указан, используются статичные значения.

---

## Мобильные фильтры каталога

На мобильных устройствах (`< lg`) боковая панель фильтров скрыта. Вместо неё используются:

- **`MobileFilterDrawer`** — выдвижная панель (85% ширины, max-w-sm) с `CatalogSidebar` внутри
- **`MobileFilterWrapper`** — клиентский враппер с render-prop для интеграции в серверные страницы
- **`ResultsBar`** — получает проп `onMobileFilterOpen` и показывает кнопку «Фильтры» на `lg:hidden`

---

## Изменённые файлы

### UI-компоненты
| Файл | Изменения |
|------|-----------|
| `components/ui/Slider.tsx` | Добавлен `breakpoints` prop, `resolveBreakpoints()`, ResizeObserver-авто подстройка |
| `components/ui/index.ts` | Экспорт типа `SliderBreakpoint` |
| `components/ui/Breadcrumbs.tsx` | Горизонтальный скролл (`overflow-x-auto scrollbar-hide`) |
| `components/ui/SectionHeader.tsx` | Адаптивные отступы (`mb-4 md:mb-6`) |

### Макет (Layout)
| Файл | Изменения |
|------|-----------|
| `components/product/StickyProductHeader.tsx` | `hidden md:block` |

### Секции главной страницы
| Файл | Изменения |
|------|-----------|
| `components/sections/BrandsCarousel.tsx` | Адаптивные отступы, breakpoints для Slider |
| `components/sections/PopularCategories.tsx` | Адаптивные отступы и типографика |
| `components/sections/RoomCategories.tsx` | Адаптивные отступы и типографика |
| `components/sections/PopularQueries.tsx` | Адаптивные отступы и типографика |
| `components/sections/Advantages.tsx` | Адаптивные отступы и типографика |
| `components/sections/AboutSection.tsx` | Адаптивные отступы |
| `components/sections/RecentlyViewed.tsx` | Адаптивные отступы и типографика |
| `components/sections/NewProducts.tsx` | Адаптивные отступы |
| `components/sections/SaleProducts.tsx` | Адаптивные отступы |

### Каталог
| Файл | Изменения |
|------|-----------|
| `components/catalog/CatalogCategoryCarousel.tsx` | breakpoints для Slider |
| `components/catalog/SubcategoryCarousel.tsx` | breakpoints для Slider |
| `components/catalog/ResultsBar.tsx` | Кнопка «Фильтры» (`lg:hidden`), проп `onMobileFilterOpen` |
| `components/catalog/MobileFilterDrawer.tsx` | **НОВЫЙ** — выдвижная панель фильтров |
| `components/catalog/MobileFilterWrapper.tsx` | **НОВЫЙ** — клиентский враппер для серверных страниц |

### Товар
| Файл | Изменения |
|------|-----------|
| `components/product/ProductGallery.tsx` | Мобильный слайдер с стрелками, горизонтальные миниатюры |
| `components/product/QuickSpecs.tsx` | `grid-cols-1 sm:grid-cols-2` |
| `components/product/ProductTabs.tsx` | Горизонтальный скролл табов |
| `components/product/ProductCarousel.tsx` | breakpoints для Slider |

### Корзина
| Файл | Изменения |
|------|-----------|
| `components/cart/CartItem.tsx` | Двухстрочная мобильная раскладка |

### Сравнение
| Файл | Изменения |
|------|-----------|
| `components/compare/CompareSpecsTable.tsx` | Горизонтальный скролл, адаптивная сетка |

### Страницы
| Файл | Изменения |
|------|-----------|
| `app/catalog/page.tsx` | Адаптивные отступы и заголовок |
| `app/catalog/[slug]/page.tsx` | MobileFilterWrapper, адаптивные отступы |
| `app/product/[slug]/page.tsx` | Адаптивные отступы |
| `app/cart/page.tsx` | Адаптивный заголовок |
| `app/compare/page.tsx` | Горизонтальный скролл, адаптивный заголовок |
| `app/favorites/page.tsx` | Адаптивный заголовок |

---

## Рекомендации для разработчиков

1. **Всегда пишите стили mobile-first** — базовые классы = мобильная версия, `md:` / `lg:` = десктоп
2. **Используйте `breakpoints` в Slider** — вместо статичного `visibleItems`
3. **Для фиксированных сеток используйте `overflow-x-auto scrollbar-hide`** — чтобы пользователь мог горизонтально скроллить
4. **Тестируйте на 375px и 480px** — фактические размеры iPhone SE и iPhone 14
5. **Не скрывайте контент** — адаптируйте, а не прячьте (кроме явно дублирующей навигации)
