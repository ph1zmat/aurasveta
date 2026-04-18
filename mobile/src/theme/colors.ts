/**
 * Design tokens converted from desktop OKLch values to HEX for React Native.
 * Source: desktop/src/index.css :root variables
 *
 * Redesign: строгая тёплая палитра, мягкие статусы.
 */
export const colors = {
	background: '#F5F0E8', // oklch(0.9618 0.0208 88.72) — warm light beige
	foreground: '#5C4A3A', // oklch(0.3795 0.0309 64.71) — dark warm brown
	card: '#FBF8F2', // oklch(0.9914 0.0098 87.47) — near-white warm
	cardForeground: '#5C4A3A',
	primary: '#B07D40', // oklch(0.6351 0.1052 63.86) — golden amber
	primaryForeground: '#FFFFFF',
	secondary: '#E8DCCA', // oklch(0.8921 0.0415 85.28) — light warm tan
	secondaryForeground: '#6B5844',
	muted: '#E2D8CA', // oklch(0.928 0.0263 82.38) — muted warm
	mutedForeground: '#8A7560', // oklch(0.5479 0.0538 71.42)
	accent: '#D9C9A5', // oklch(0.8479 0.0584 89.65) — soft gold
	accentForeground: '#5C4A3A',
	destructive: '#C62828', // oklch(0.5679 0.1914 32.99) — deep red
	destructiveForeground: '#FFFFFF',
	border: '#D4C4AA', // oklch(0.8688 0.045 83.89) — warm border
	input: '#D4C4AA',
	ring: '#B07D40', // same as primary

	// Soft separator for cards/sections (lighter than border)
	separator: '#E8DFD0',
	borderLight: '#E8DFD0', // alias for separator — used in card borders

	// Status colors — средняя яркость, без кислотности
	statusPending: '#D4940A', // warmer amber
	statusPendingBg: '#FDF6E3', // warm cream
	statusPaid: '#2E9E6E', // warm green
	statusPaidBg: '#E6F5ED', // soft mint
	statusShipped: '#7C5ABF', // muted violet
	statusShippedBg: '#F0EBF8', // soft lavender
	statusDelivered: '#3A8DB5', // warm teal
	statusDeliveredBg: '#E5F2F8', // soft sky
	statusCancelled: '#C0392B', // warm red
	statusCancelledBg: '#FBEAE8', // soft rose

	// Utility
	white: '#FFFFFF',
	black: '#000000',
	transparent: 'transparent',

	// Badge type colors (properties)
	typeString: '#3B82F6', // blue
	typeNumber: '#D4940A', // warm amber
	typeBoolean: '#2E9E6E', // warm green
	typeDate: '#7C5ABF', // muted violet
	typeSelect: '#C47A8A', // dusty rose

	// SEO status
	seoGood: '#2E9E6E',
	seoPartial: '#D4940A',
	seoEmpty: '#9CA3AF',

	// Overlay colors
	overlayDark: 'rgba(0,0,0,0.6)',
	overlayMedium: 'rgba(0,0,0,0.45)',
	overlayLight: 'rgba(0,0,0,0.25)',
	overlayWhite: 'rgba(255,255,255,0.6)',
	overlayWhiteLight: 'rgba(255,255,255,0.25)',
	overlayWhiteMuted: 'rgba(255,255,255,0.3)',
} as const

export type StatusKey =
	| 'PENDING'
	| 'PAID'
	| 'SHIPPED'
	| 'DELIVERED'
	| 'CANCELLED'

export const STATUS_COLORS: Record<
	StatusKey,
	{ color: string; bg: string; label: string }
> = {
	PENDING: {
		color: colors.statusPending,
		bg: colors.statusPendingBg,
		label: 'Ожидает',
	},
	PAID: { color: colors.statusPaid, bg: colors.statusPaidBg, label: 'Оплачен' },
	SHIPPED: {
		color: colors.statusShipped,
		bg: colors.statusShippedBg,
		label: 'Отправлен',
	},
	DELIVERED: {
		color: colors.statusDelivered,
		bg: colors.statusDeliveredBg,
		label: 'Доставлен',
	},
	CANCELLED: {
		color: colors.statusCancelled,
		bg: colors.statusCancelledBg,
		label: 'Отменён',
	},
}
