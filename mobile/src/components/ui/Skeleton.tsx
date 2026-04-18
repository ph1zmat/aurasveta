import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, type ViewStyle } from 'react-native'
import { colors, borderRadius } from '../../theme'

interface SkeletonProps {
	width: number | `${number}%`
	height: number
	borderRadiusToken?: keyof typeof borderRadius
	style?: ViewStyle
}

/**
 * Animated skeleton placeholder that matches content shape.
 * Uses native Animated API (no reanimated needed) for pulse effect.
 */
export function Skeleton({
	width,
	height,
	borderRadiusToken = 'md',
	style,
}: SkeletonProps) {
	const opacity = useRef(new Animated.Value(0.3)).current

	useEffect(() => {
		const animation = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 0.7,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 0.3,
					duration: 800,
					useNativeDriver: true,
				}),
			]),
		)
		animation.start()
		return () => animation.stop()
	}, [opacity])

	return (
		<Animated.View
			style={[
				styles.base,
				{
					width,
					height,
					borderRadius: borderRadius[borderRadiusToken],
					opacity,
				},
				style,
			]}
		/>
	)
}

/** Pre-built skeleton layouts for common patterns */
export function SkeletonCard() {
	return (
		<Animated.View style={styles.card}>
			<Skeleton width='100%' height={14} style={{ marginBottom: 8 }} />
			<Skeleton width='60%' height={14} style={{ marginBottom: 12 }} />
			<Skeleton width='40%' height={24} />
		</Animated.View>
	)
}

export function SkeletonListItem() {
	return (
		<Animated.View style={styles.listItem}>
			<Skeleton width={44} height={44} borderRadiusToken='sm' />
			<Animated.View style={styles.listItemText}>
				<Skeleton width='70%' height={14} style={{ marginBottom: 6 }} />
				<Skeleton width='45%' height={12} />
			</Animated.View>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	base: {
		backgroundColor: colors.muted,
	},
	card: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		borderColor: colors.border,
		padding: 16,
		marginBottom: 12,
	},
	listItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
	},
	listItemText: {
		flex: 1,
		marginLeft: 12,
	},
})
