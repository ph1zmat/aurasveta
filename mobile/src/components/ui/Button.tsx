import {
	Pressable,
	Text,
	View,
	StyleSheet,
	ActivityIndicator,
	Platform,
	type ViewStyle,
	type TextStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
	ripple,
	elevation,
} from '../../theme'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
	title: string
	onPress: () => void
	variant?: Variant
	size?: Size
	disabled?: boolean
	loading?: boolean
	style?: ViewStyle
	textStyle?: TextStyle
	icon?: ReactNode
	haptic?: boolean
}

const variantStyles: Record<
	Variant,
	{ bg: string; text: string; border?: string }
> = {
	primary: { bg: colors.primary, text: colors.primaryForeground },
	secondary: { bg: colors.secondary, text: colors.secondaryForeground },
	ghost: { bg: colors.transparent, text: colors.foreground },
	destructive: { bg: colors.destructive, text: colors.destructiveForeground },
}

const sizeStyles: Record<Size, { height: number; px: number; fs: number }> = {
	sm: { height: 36, px: spacing.md, fs: fontSize.sm },
	md: { height: 44, px: spacing.lg, fs: fontSize.base },
	lg: { height: 52, px: spacing.xl, fs: fontSize.lg },
}

export function Button({
	title,
	onPress,
	variant = 'primary',
	size = 'md',
	disabled,
	loading,
	style,
	textStyle,
	icon,
	haptic = true,
}: ButtonProps) {
	const v = variantStyles[variant]
	const s = sizeStyles[size]

	const handlePress = () => {
		if (haptic) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
		}
		onPress()
	}

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled || loading}
			android_ripple={ripple[variant]}
			hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			accessibilityRole='button'
			accessibilityState={{ disabled: disabled || loading, busy: loading }}
			accessibilityLabel={title}
			style={({ pressed }) => [
				styles.base,
				variant !== 'ghost' && elevation(1),
				{
					backgroundColor: v.bg,
					height: s.height,
					paddingHorizontal: s.px,
					borderColor: v.border || colors.transparent,
					borderWidth: v.border ? 1 : 0,
					opacity: disabled ? 0.5 : pressed && Platform.OS === 'ios' ? 0.7 : 1,
				},
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator size='small' color={v.text} />
			) : (
				<View style={styles.content}>
					{icon}
					{title ? (
						<Text
							style={[
								styles.text,
								{ color: v.text, fontSize: s.fs },
								icon ? { marginLeft: 8 } : undefined,
								textStyle,
							]}
							numberOfLines={1}
						>
							{title}
						</Text>
					) : null}
				</View>
			)}
		</Pressable>
	)
}

const styles = StyleSheet.create({
	base: {
		borderRadius: borderRadius.md,
		justifyContent: 'center',
		alignItems: 'center',
		flexDirection: 'row',
		overflow: Platform.OS === 'android' ? 'hidden' : 'visible', // required for ripple containment
	},
	content: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	text: {
		fontFamily: fontFamily.base,
		fontWeight: fontWeight.semibold,
		letterSpacing: 0.3,
	},
})
