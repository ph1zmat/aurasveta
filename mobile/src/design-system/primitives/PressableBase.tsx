import {
	Pressable,
	Platform,
	type PressableProps,
	type ViewStyle,
	type GestureResponderEvent,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { ripple, type RippleVariant } from '../tokens'

interface PressableBaseProps extends Omit<PressableProps, 'style'> {
	/** Ripple preset variant */
	rippleVariant?: RippleVariant
	/** Enable haptic feedback on press (default: true) */
	haptic?: boolean
	/** Haptic style */
	hapticStyle?: Haptics.ImpactFeedbackStyle
	/** Hit slop — расширяет область нажатия (default: 8px all sides) */
	hitSlopSize?: number
	/** Style — принимает ViewStyle или функцию */
	style?:
		| ViewStyle
		| ViewStyle[]
		| ((state: { pressed: boolean }) => ViewStyle | ViewStyle[])
	/** iOS pressed opacity (default: 0.7) */
	pressedOpacity?: number
}

/**
 * Централизованный Pressable с haptics + ripple.
 *
 * Единый HOC для всех интерактивных компонентов:
 * - IconButton, PressableRow, Card (pressable), Button
 * - Гарантирует одинаковые haptics, ripple и hitSlop на всех площадках
 *
 * @example
 * <PressableBase
 *   rippleVariant="ghost"
 *   haptic
 *   onPress={() => navigate('Detail')}
 *   style={styles.row}
 * >
 *   <Text>Row content</Text>
 * </PressableBase>
 */
export function PressableBase({
	rippleVariant = 'ghost',
	haptic = true,
	hapticStyle = Haptics.ImpactFeedbackStyle.Light,
	hitSlopSize = 8,
	style,
	pressedOpacity = 0.7,
	onPress,
	disabled,
	children,
	...rest
}: PressableBaseProps) {
	const handlePress = (e: GestureResponderEvent) => {
		if (haptic) {
			Haptics.impactAsync(hapticStyle).catch(() => {})
		}
		onPress?.(e)
	}

	const hitSlop = {
		top: hitSlopSize,
		bottom: hitSlopSize,
		left: hitSlopSize,
		right: hitSlopSize,
	}

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled}
			android_ripple={ripple[rippleVariant]}
			hitSlop={hitSlop}
			style={(state) => {
				const baseOpacity: ViewStyle =
					Platform.OS === 'ios' && state.pressed && !disabled
						? { opacity: pressedOpacity }
						: {}

				const overflow: ViewStyle =
					Platform.OS === 'android' ? { overflow: 'hidden' } : {}

				const disabledStyle: ViewStyle = disabled ? { opacity: 0.5 } : {}

				if (typeof style === 'function') {
					const resolved = style(state)
					return [overflow, disabledStyle, baseOpacity, ...(Array.isArray(resolved) ? resolved : [resolved])]
				}

				return [overflow, disabledStyle, baseOpacity, ...(Array.isArray(style) ? style : style ? [style] : [])]
			}}
			{...rest}
		>
			{children}
		</Pressable>
	)
}
