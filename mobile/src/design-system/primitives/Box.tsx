import { View as RNView, type ViewProps, type ViewStyle } from 'react-native'
import { spacing, colors } from '../tokens'

type SpacingToken = keyof typeof spacing

interface BoxProps extends ViewProps {
	/** Horizontal padding token */
	px?: SpacingToken
	/** Vertical padding token */
	py?: SpacingToken
	/** All-sides padding token */
	p?: SpacingToken
	/** Horizontal margin token */
	mx?: SpacingToken
	/** Vertical margin token */
	my?: SpacingToken
	/** All-sides margin token */
	m?: SpacingToken
	/** Gap between children (flexbox gap) */
	gap?: SpacingToken
	/** Background color from theme or custom */
	bg?: keyof typeof colors | (string & {})
	/** flex: 1 shorthand */
	flex?: boolean
	/** flexDirection: 'row' */
	row?: boolean
	/** alignItems: 'center' */
	center?: boolean
}

/**
 * Базовый примитив Box — обёртка над View с токенами дизайн-системы.
 *
 * Использует spacing-токены для отступов/margin/gap, что гарантирует
 * единообразие на всех экранах.
 *
 * @example
 * <Box px="lg" py="md" bg="background" flex>
 *   <Box row gap="sm" center>
 *     <Icon />
 *     <DSText variant="body">Hello</DSText>
 *   </Box>
 * </Box>
 */
export function Box({
	px,
	py,
	p,
	mx,
	my,
	m,
	gap: gapToken,
	bg,
	flex,
	row,
	center,
	style,
	...rest
}: BoxProps) {
	const tokenStyle: ViewStyle = {}

	if (p) tokenStyle.padding = spacing[p]
	if (px) tokenStyle.paddingHorizontal = spacing[px]
	if (py) tokenStyle.paddingVertical = spacing[py]
	if (m) tokenStyle.margin = spacing[m]
	if (mx) tokenStyle.marginHorizontal = spacing[mx]
	if (my) tokenStyle.marginVertical = spacing[my]
	if (gapToken) tokenStyle.gap = spacing[gapToken]
	if (bg) {
		tokenStyle.backgroundColor =
			bg in colors ? colors[bg as keyof typeof colors] : bg
	}
	if (flex) tokenStyle.flex = 1
	if (row) tokenStyle.flexDirection = 'row'
	if (center) tokenStyle.alignItems = 'center'

	return <RNView style={[tokenStyle, style]} {...rest} />
}
