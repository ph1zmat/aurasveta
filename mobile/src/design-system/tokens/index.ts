/**
 * Design tokens — re-export из src/theme для единой точки входа.
 * Все токены доступны через `@/design-system` (barrel export).
 */
export { colors, STATUS_COLORS, type StatusKey } from '../../theme/colors'

export {
	fontFamily,
	fontSize,
	fontWeight,
	letterSpacing,
} from '../../theme/typography'

export { spacing, borderRadius } from '../../theme/spacing'

export { elevation } from '../../theme/elevation'

export { scaledFontSize, lineHeight } from '../../theme/scale'

export { ripple, type RippleVariant } from '../../theme/ripple'
