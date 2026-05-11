# Унифицированная UI-система компонентов

> **Стек:** CVA (class-variance-authority) + Tailwind CSS 4 + Radix Slot + `cn()` (clsx + tailwind-merge)

Все базовые UI-примитивы находятся в `components/ui/` и реэкспортируются через `components/ui/index.ts`.

```ts
import { Button, Input, Checkbox, Card } from '@/components/ui'
```

---

## Button

Файл: `components/ui/Button.tsx`

### Варианты (`variant`)

| Variant   | Назначение             | Визуал                                                             |
| --------- | ---------------------- | ------------------------------------------------------------------ |
| `primary` | Основной CTA           | Залитая, `bg-foreground`, uppercase, tracking-wider                |
| `outline` | Вторичный CTA          | Рамка `border-foreground`, hover заливка                           |
| `ghost`   | Текстовая (muted)      | `text-muted-foreground`, hover → foreground                        |
| `link`    | Текстовая (foreground) | `text-foreground`, hover → primary                                 |
| `icon`    | Иконка-действие        | `text-muted-foreground`, hover → foreground, disabled → opacity-30 |
| `subtle`  | Мягкая рамка           | `border-border`, hover → `bg-accent`                               |
| `chip`    | Pill-тег               | `rounded-full`, `border-foreground`, hover заливка                 |

### Размеры (`size`)

| Size        | Паддинг     | Текст   | Авто-привязка к variant    |
| ----------- | ----------- | ------- | -------------------------- |
| `xs`        | px-5 py-2.5 | text-xs | primary, outline (default) |
| `sm`        | px-6 py-2.5 | text-xs | —                          |
| `default`   | px-8 py-3   | text-sm | —                          |
| `lg`        | py-3.5      | text-sm | —                          |
| `compact`   | px-3 py-1.5 | text-xs | subtle (default)           |
| `icon-sm`   | p-1         | —       | icon (default)             |
| `icon`      | p-2         | —       | —                          |
| `chip`      | px-4 py-2   | text-sm | chip (default)             |
| `inline`    | —           | text-sm | ghost, link (default)      |
| `inline-xs` | —           | text-xs | —                          |

> Если `size` не указан, он определяется автоматически через `getDefaultSize(variant)`.

### Дополнительные пропсы

| Prop        | Тип       | Описание                                      |
| ----------- | --------- | --------------------------------------------- |
| `fullWidth` | `boolean` | Добавляет `w-full`                            |
| `asChild`   | `boolean` | Рендерит через `Slot.Root` (Radix) для `Link` |
| `className` | `string`  | Мёржится через `cn()` (tailwind-merge)        |

### Примеры использования

```tsx
{
	/* CTA-кнопка на карточке товара */
}
;<Button variant='primary' size='xs'>
	В корзину
</Button>

{
	/* CTA как Link */
}
;<Button asChild variant='primary' size='lg' fullWidth>
	<Link href='/checkout'>Перейти к оформлению</Link>
</Button>

{
	/* Иконка-действие */
}
;<Button variant='icon' aria-label='В избранное'>
	<Heart className='h-4 w-4' />
</Button>

{
	/* Chip-ссылка */
}
;<Button asChild variant='chip'>
	<Link href='/search?q=люстры'>люстры</Link>
</Button>

{
	/* Текстовая кнопка */
}
;<Button variant='ghost'>Удалить все</Button>
```

---

## Input

Файл: `components/ui/Input.tsx`

### Варианты (`variant`)

| Variant   | Назначение     | Визуал                                         |
| --------- | -------------- | ---------------------------------------------- |
| `default` | Текстовое поле | `rounded-sm`, `border-border`, focus → ring    |
| `search`  | Поле поиска    | `rounded-full`, `border-input`, focus → ring-2 |

### Примеры

```tsx
{
	/* Стандартное поле */
}
;<Input value={code} onChange={e => setCode(e.target.value)} />

{
	/* Поле поиска (с иконкой-оберткой) */
}
;<div className='relative'>
	<Search className='absolute left-3 top-1/2 -translate-y-1/2' />
	<Input variant='search' placeholder='Найти' />
</div>
```

---

## Checkbox

Файл: `components/ui/Checkbox.tsx`

### Размеры (`size`)

| Size      | Габариты    | Контекст                      |
| --------- | ----------- | ----------------------------- |
| `default` | h-4 w-4     | Фильтры каталога              |
| `sm`      | h-3.5 w-3.5 | Компактный (сборка в корзине) |

### Пример

```tsx
<label className='flex items-center gap-2'>
	<Checkbox checked={checked} onChange={e => onChange(e.target.checked)} />
	<span>Фильтр</span>
</label>
```

---

## Card

Файл: `components/ui/Card.tsx`

### Варианты (`variant`)

| Variant   | Назначение                | Визуал                           |
| --------- | ------------------------- | -------------------------------- |
| `default` | Информационный блок       | `border border-border bg-card`   |
| `banner`  | Цветной баннер            | `bg-destructive/10` (без border) |
| `product` | Контейнер карточки товара | `group relative flex flex-col`   |

### Паддинг (`padding`)

| Padding   | Значение  |
| --------- | --------- |
| `default` | p-6       |
| `compact` | p-4       |
| `banner`  | px-6 py-4 |
| `none`    | —         |

### Примеры

```tsx
{
	/* Блок цены */
}
;<Card>
	<h2>Ваша корзина</h2>
	...
</Card>

{
	/* Характеристики (компактный) */
}
;<Card padding='compact'>
	<div className='grid grid-cols-2'>...</div>
</Card>

{
	/* Баннер */
}
;<Card variant='banner' padding='banner'>
	<p>Есть дизайн проект?</p>
</Card>
```

---

## Архитектурные решения

1. **CVA для вариантов** — все стили описаны декларативно в одном месте, type-safe через TypeScript
2. **`cn()` merge** — className пропс мёржится через tailwind-merge, что позволяет безопасно переопределять отдельные утилиты
3. **`asChild` (Radix Slot)** — Button рендерится как `<a>` при оборачивании `<Link>`, сохраняя семантику и accessibility
4. **`getDefaultSize()`** — size автоматически подбирается по variant, уменьшая boilerplate
5. **`forwardRef`** — все компоненты поддерживают ref для интеграции с формами и библиотеками

## Что НЕ входит в UI-систему (осознанно)

Эти элементы имеют уникальную логику состояния и не подлежат унификации:

- Tab-кнопки (`FavoritesCategoryTabs`, `ViewToggle`, `ProductTabs`)
- Pagination (`Pagination`)
- Accordion toggles (`FilterSection`, `CategoryTree`)
- Dropdown triggers (`ResultsBar`, `TopBar`)
- Thumbnail selection (`ProductGallery` — кнопки выбора миниатюр)
- ChatButton (floating FAB)

---

## Slider

Унифицированный компонент карусели. Расположение: `components/ui/Slider.tsx`.

### Пропсы

| Проп               | Тип                     | По умолчанию | Описание                        |
| ------------------ | ----------------------- | ------------ | ------------------------------- |
| `children`         | `ReactNode`             | —            | Слайды (каждый child = 1 слайд) |
| `visibleItems`     | `number`                | `1`          | Количество видимых элементов    |
| `autoPlay`         | `boolean`               | `false`      | Автопрокрутка                   |
| `autoPlayInterval` | `number`                | `3000`       | Интервал автопрокрутки (мс)     |
| `arrows`           | `boolean`               | `true`       | Показывать стрелки              |
| `arrowsPosition`   | `'inside' \| 'outside'` | `'inside'`   | Расположение стрелок            |
| `dots`             | `boolean`               | `false`      | Показывать точки навигации      |
| `loop`             | `boolean`               | `true`       | Зацикливание                    |
| `gap`              | `number`                | `0`          | Отступ между слайдами (px)      |
| `className`        | `string`                | —            | Класс внешнего контейнера       |
| `slideClassName`   | `string`                | —            | Класс обёртки каждого слайда    |
| `arrowClassName`   | `string`                | —            | Класс кнопки-стрелки            |
| `renderArrow`      | `(props) => ReactNode`  | —            | Кастомный рендер стрелки        |

### Ref API (SliderHandle)

| Метод         | Описание                     |
| ------------- | ---------------------------- |
| `next()`      | Перейти к следующему слайду  |
| `prev()`      | Перейти к предыдущему слайду |
| `goTo(index)` | Перейти к конкретному слайду |

### Точки (dots)

- Неактивная: `bg-transparent border-2 border-foreground` (круг 10px)
- Активная: `bg-foreground border-2 border-foreground`
- Доступность: `role="tab"`, `aria-selected`, `aria-label`

### Примеры

```tsx
{
	/* Баннер: 1 слайд, точки, зацикливание */
}
;<Slider visibleItems={1} dots loop>
	<BannerSlide1 />
	<BannerSlide2 />
</Slider>

{
	/* Карточки: 5 видимых, стрелки внутри */
}
;<Slider visibleItems={5} gap={16} loop={false}>
	{products.map(p => (
		<ProductCard key={p.id} {...p} />
	))}
</Slider>

{
	/* Бренды: стрелки снаружи */
}
;<Slider visibleItems={6} gap={32} arrowsPosition='outside'>
	{brands.map(b => (
		<BrandCard key={b.id} {...b} />
	))}
</Slider>
```
