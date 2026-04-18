import { Platform } from 'react-native'
import { colors } from './colors'

/**
 * Android Ripple configuration presets per variant.
 *
 * `borderless: true` — for icon buttons (ripple extends beyond bounds).
 * `foreground: true` — ripple renders above content (Android 6+).
 */
export const ripple = {
	primary: {
		color: 'rgba(176,125,64,0.18)',
		borderless: false,
		foreground: Platform.OS === 'android' && Platform.Version >= 23,
	},
	secondary: {
		color: 'rgba(107,88,68,0.12)',
		borderless: false,
		foreground: Platform.OS === 'android' && Platform.Version >= 23,
	},
	ghost: {
		color: 'rgba(92,74,58,0.08)',
		borderless: false,
		foreground: Platform.OS === 'android' && Platform.Version >= 23,
	},
	destructive: {
		color: 'rgba(198,40,40,0.15)',
		borderless: false,
		foreground: Platform.OS === 'android' && Platform.Version >= 23,
	},
	icon: {
		color: 'rgba(92,74,58,0.12)',
		borderless: true,
		foreground: Platform.OS === 'android' && Platform.Version >= 23,
	},
} as const

export type RippleVariant = keyof typeof ripple
