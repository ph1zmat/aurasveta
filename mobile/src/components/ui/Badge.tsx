import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
	getStatusPresentation,
} from '../../theme'

interface BadgeProps {
	label: string
	color?: string
	bg?: string
	style?: ViewStyle
}

export function Badge({
	label,
	color = colors.foreground,
	bg = colors.muted,
	style,
}: BadgeProps) {
	return (
		<View style={[styles.badge, { backgroundColor: bg }, style]}>
			<Text style={[styles.text, { color }]}>{label}</Text>
		</View>
	)
}

export function StatusBadge({ status }: { status: string }) {
	const cfg = getStatusPresentation(status)
	return <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
}

const styles = StyleSheet.create({
	badge: {
		borderRadius: borderRadius.full,
		paddingHorizontal: spacing.md,
		paddingVertical: 3,
		alignSelf: 'flex-start',
	},
	text: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.semibold,
	},
})
