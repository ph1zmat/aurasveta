import {
	View,
	Text,
	StyleSheet,
	type ViewStyle,
	type ReactNode,
} from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { colors, fontSize, fontWeight, fontFamily, spacing } from '../../theme'
import { PressableBase } from '../../design-system'

interface PressableRowProps {
	title: string
	subtitle?: string
	left?: ReactNode
	right?: ReactNode
	onPress: () => void
	showChevron?: boolean
	style?: ViewStyle
}

/**
 * Material 3 style list item with ripple effect + haptic feedback.
 * Use for settings menus, category lists, order items, etc.
 */
export function PressableRow({
	title,
	subtitle,
	left,
	right,
	onPress,
	showChevron = true,
	style,
}: PressableRowProps) {
	return (
		<PressableBase
			onPress={onPress}
			rippleVariant='ghost'
			haptic
			hitSlopSize={0}
			pressedOpacity={1}
			style={[styles.container, style]}
		>
			{left && <View style={styles.left}>{left}</View>}
			<View style={styles.content}>
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
				{subtitle && (
					<Text style={styles.subtitle} numberOfLines={1}>
						{subtitle}
					</Text>
				)}
			</View>
			{right && <View style={styles.right}>{right}</View>}
			{showChevron && <ChevronRight size={18} color={colors.mutedForeground} />}
		</PressableBase>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		minHeight: 56,
	},
	left: {
		marginRight: spacing.md,
	},
	content: {
		flex: 1,
	},
	title: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
	},
	subtitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
		marginTop: 2,
	},
	right: {
		marginLeft: spacing.sm,
		marginRight: spacing.sm,
	},
})
