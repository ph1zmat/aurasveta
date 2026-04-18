import { View, Text, StyleSheet, type ReactNode } from 'react-native'
import { colors, fontSize, fontWeight, fontFamily, spacing } from '../../theme'

interface EmptyStateProps {
	icon?: ReactNode | string
	title: string
	description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
	return (
		<View style={styles.container}>
			{icon ? (
				typeof icon === 'string' ? (
					<Text style={styles.iconText}>{icon}</Text>
				) : (
					<View style={styles.iconWrap}>{icon}</View>
				)
			) : null}
			<Text style={styles.title}>{title}</Text>
			{description ? <Text style={styles.desc}>{description}</Text> : null}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		padding: spacing['3xl'],
	},
	iconWrap: {
		marginBottom: spacing.md,
	},
	iconText: {
		fontSize: 40,
		marginBottom: spacing.md,
	},
	title: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		textAlign: 'center',
	},
	desc: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
		textAlign: 'center',
		marginTop: spacing.xs,
	},
})
