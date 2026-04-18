import {
	View,
	Pressable,
	StyleSheet,
	Platform,
	type ViewStyle,
	type ReactNode,
} from 'react-native'
import { colors, borderRadius, spacing, elevation, ripple } from '../../theme'

interface CardProps {
	children: ReactNode
	style?: ViewStyle
	onPress?: () => void
	elevationLevel?: 0 | 1 | 2 | 3 | 4 | 5
}

export function Card({
	children,
	style,
	onPress,
	elevationLevel = 1,
}: CardProps) {
	const cardStyle = [styles.card, elevation(elevationLevel), style]

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				android_ripple={ripple.ghost}
				style={({ pressed }) => [
					...cardStyle,
					pressed && Platform.OS === 'ios' ? { opacity: 0.85 } : undefined,
					Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
				]}
			>
				{children}
			</Pressable>
		)
	}

	return <View style={cardStyle}>{children}</View>
}

const styles = StyleSheet.create({
	card: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: spacing.lg,
	},
})
