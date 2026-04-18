/**
 * Font family token.
 * ChironGoRoundTC loaded via expo-font in App.tsx.
 * Use fontFamily.base for all text, fontFamily.system as fallback.
 */
export const fontFamily = {
	base: 'ChironGoRoundTC',
	system: undefined as string | undefined, // platform default
} as const

export const fontSize = {
	xs: 10,
	sm: 12,
	base: 14,
	lg: 16,
	xl: 20,
	'2xl': 24,
	'3xl': 28,
} as const

export const fontWeight = {
	normal: '400' as const,
	medium: '500' as const,
	semibold: '600' as const,
	bold: '700' as const,
}

export const letterSpacing = {
	tight: 0,
	normal: 0.3,
	wide: 0.8,
	wider: 1.5,
}
