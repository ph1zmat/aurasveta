import { StyleSheet } from 'react-native'
import { PressableBase } from '../../design-system'
import { colors, borderRadius as br } from '../../theme'
import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

type IconButtonSize = 'sm' | 'md' | 'lg'
type IconButtonVariant = 'ghost' | 'surface' | 'overlay'

interface IconButtonProps {
	icon: ReactNode
	onPress: () => void
	disabled?: boolean
	style?: ViewStyle
	accessibilityLabel: string
	/** sm=32, md=36, lg=40. Default: md */
	size?: IconButtonSize
	/** ghost=transparent, surface=muted bg, overlay=dark bg. Default: surface */
	variant?: IconButtonVariant
}

const SIZE_MAP: Record<IconButtonSize, number> = {
	sm: 32,
	md: 36,
	lg: 40,
}

const VARIANT_MAP: Record<IconButtonVariant, ViewStyle> = {
	ghost: {},
	surface: { backgroundColor: colors.muted },
	overlay: { backgroundColor: colors.overlayMedium },
}

export function IconButton({
	icon,
	onPress,
	disabled,
	style,
	accessibilityLabel,
	size = 'md',
	variant = 'surface',
}: IconButtonProps) {
	const dim = SIZE_MAP[size]
	return (
		<PressableBase
			onPress={onPress}
			disabled={disabled}
			rippleVariant='icon'
			haptic
			hitSlopSize={12}
			pressedOpacity={0.5}
			accessibilityRole='button'
			accessibilityLabel={accessibilityLabel}
			accessibilityState={{ disabled }}
			style={[
				styles.base,
				{ width: dim, height: dim, borderRadius: br.sm },
				VARIANT_MAP[variant],
				style,
			]}
		>
			{icon}
		</PressableBase>
	)
}

const styles = StyleSheet.create({
	base: {
		justifyContent: 'center',
		alignItems: 'center',
	},
})
