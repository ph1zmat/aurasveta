# Mobile Design Spec — Аура Света CMS

## Палитра

Тёплая, строгая. Основа: background #F5F0E8, primary #B07D40, foreground #5C4A3A.

## Border Radius

| Token | Value | Usage                         |
| ----- | ----- | ----------------------------- |
| none  | 0     | Dividers                      |
| sm    | 6     | Small badges, chips           |
| md    | 12    | Buttons, inputs, tabs, cards  |
| lg    | 16    | Modals, bottom sheets         |
| xl    | 20    | Large cards, images           |
| full  | 9999  | Circular avatars, status dots |

## Elevation

| Level | Usage                           |
| ----- | ------------------------------- |
| 0     | Flat content                    |
| 1     | Cards, list items — тонкая тень |
| 2     | Raised cards (hover/active)     |
| 3     | FAB, modals                     |
| 4     | Tab bar                         |

Карточки: border 1px colors.border + elevation(1). Без "голой" тени без бордера.

## Типографика

Шрифт: Chiron GoRound TC WS, fallback System.

| Variant   | Size | Weight | Line-height |
| --------- | ---- | ------ | ----------- |
| h1        | 28   | 700    | 1.3×        |
| h2        | 24   | 700    | 1.3×        |
| h3        | 20   | 600    | 1.3×        |
| body      | 14   | 400    | 1.5×        |
| bodySmall | 12   | 400    | 1.5×        |
| caption   | 10   | 500    | 1.5×        |
| label     | 12   | 600    | 1.5×        |

## Spacing

| Token | px  |
| ----- | --- |
| xs    | 4   |
| sm    | 8   |
| md    | 12  |
| lg    | 16  |
| xl    | 24  |
| 2xl   | 32  |
| 3xl   | 48  |

## Компоненты

### Button

- Radius: md (12)
- Высота: sm=36, md=44, lg=52
- Primary: solid primary, white text
- Secondary: solid secondary, dark text
- Ghost: transparent bg, dark text
- Destructive: solid red, white text

### Card

- Radius: md (12)
- Border: 1px colors.border
- Elevation: 1 (default)
- Padding: lg (16)

### Input

- Radius: md (12)
- Height: 48
- Border: 1px colors.border
- Focus: borderColor → primary

### Badge

- Radius: full (pill)
- Статусы: средняя яркость, без кислотности

### Tab Bar

- Высота: 64 (Android), 56+safe (iOS)
- Bg: colors.card
- Active: primary icon + primary pill bg 10%
- Label: 11px, weight 600

### Screen Header

- Единый шаблон: icon + title + right slot
- Без gradient, чистый фон
- Title: h2 (24, bold)

### Modal

- Bottom sheet
- Radius: lg (16) top
- Handle indicator

### Empty State

- Centered, icon + title + description
- Muted colors

### Loading

- Skeleton с pulse animation
- Форма скелетонов повторяет контент
