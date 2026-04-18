import {
	Text as RNText,
	type TextProps as RNTextProps,
	type TextStyle,
} from 'react-native'
import {
	colors,
	fontFamily,
	fontSize as fontSizeTokens,
	fontWeight as fontWeightTokens,
	scaledFontSize,
	lineHeight,
} from '../tokens'

type FontSizeToken = keyof typeof fontSizeTokens
type FontWeightToken = keyof typeof fontWeightTokens
type ColorToken = keyof typeof colors

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'bodySmall' | 'caption' | 'label'

const variantMap: Record<
	Variant,
	{ size: FontSizeToken; weight: FontWeightToken; heading?: boolean }
> = {
	h1: { size: '3xl', weight: 'bold', heading: true },
	h2: { size: '2xl', weight: 'bold', heading: true },
	h3: { size: 'xl', weight: 'semibold', heading: true },
	body: { size: 'base', weight: 'normal' },
	bodySmall: { size: 'sm', weight: 'normal' },
	caption: { size: 'xs', weight: 'medium' },
	label: { size: 'sm', weight: 'semibold' },
}

interface DSTextProps extends RNTextProps {
	/** Semantic variant — определяет размер, вес и line-height */
	variant?: Variant
	/** Цвет из палитры или кастомный */
	color?: ColorToken | (string & {})
	/** Центрирование текста */
	center?: boolean
	/** Жирность (переопределяет variant) */
	weight?: FontWeightToken
	/** Размер (переопределяет variant) */
	size?: FontSizeToken
}

/**
 * Типографический примитив — обёртка над Text с токенами дизайн-системы.
 * Автоматически применяет scaledFontSize (Android accessibility cap) и lineHeight.
 *
 * @example
 * <DSText variant="h2">Заголовок</DSText>
 * <DSText variant="body" color="mutedForeground">Описание</DSText>
 * <DSText variant="caption" center>Мелкий текст</DSText>
 */
export function DSText({
	variant = 'body',
	color = 'foreground',
	center,
	weight,
	size,
	style,
	...rest
}: DSTextProps) {
	const v = variantMap[variant]
	const resolvedSize = size ? fontSizeTokens[size] : fontSizeTokens[v.size]
	const resolvedWeight = weight
		? fontWeightTokens[weight]
		: fontWeightTokens[v.weight]

	const textStyle: TextStyle = {
		fontFamily: fontFamily.base,
		fontSize: scaledFontSize(resolvedSize),
		fontWeight: resolvedWeight,
		lineHeight: lineHeight(resolvedSize, v.heading),
		color: color in colors ? colors[color as ColorToken] : color,
	}

	if (center) textStyle.textAlign = 'center'

	return <RNText style={[textStyle, style]} {...rest} />
}
