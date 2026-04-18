/**
 * Design System — единая точка входа.
 *
 * Структура:
 *   tokens/    — цвета, типографика, отступы, elevation, ripple
 *   primitives/ — Box, DSText, PressableBase, ScreenContainer
 *   hooks/     — useSpacing
 *   theme/     — алиас токенов (обратная совместимость)
 *
 * Импорт:
 *   import { Box, DSText, PressableBase, ScreenContainer } from '@/design-system'
 *   import { colors, spacing, fontSize } from '@/design-system'
 *   import { useSpacing } from '@/design-system'
 */

// Tokens (design tokens)
export * from './tokens'

// Primitives (base components)
export { Box } from './primitives/Box'
export { DSText } from './primitives/Text'
export { PressableBase } from './primitives/PressableBase'
export { ScreenContainer } from './primitives/ScreenContainer'

// Hooks
export { useSpacing } from './hooks/useSpacing'
