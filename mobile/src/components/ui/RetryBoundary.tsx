import { View, Text, StyleSheet, type ReactNode } from 'react-native'
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
} from '../../theme'
import { Button } from './Button'

interface RetryBoundaryProps {
	children: ReactNode
	/** tRPC / React Query isLoading */
	isLoading: boolean
	/** Error object (if any) */
	error: { message: string } | null | undefined
	/** Refetch / retry callback */
	onRetry: () => void
	/** Skeleton to show while loading (must match content shape) */
	skeleton: ReactNode
}

/**
 * Единая обёртка: показывает skeleton при загрузке, ошибку с retry при сбое,
 * и children при успехе. Устраняет CLS — skeleton точно повторяет форму контента.
 */
export function RetryBoundary({
	children,
	isLoading,
	error,
	onRetry,
	skeleton,
}: RetryBoundaryProps) {
	if (isLoading) return <>{skeleton}</>

	if (error) {
		const isNetwork =
			error.message.toLowerCase().includes('network') ||
			error.message.toLowerCase().includes('fetch')

		return (
			<View style={styles.container}>
				{isNetwork ? (
					<WifiOff size={40} color={colors.mutedForeground} />
				) : (
					<AlertTriangle size={40} color={colors.destructive} />
				)}
				<Text style={styles.title}>
					{isNetwork ? 'Нет соединения' : 'Ошибка загрузки'}
				</Text>
				<Text style={styles.message} numberOfLines={3}>
					{isNetwork ? 'Проверьте подключение к интернету' : error.message}
				</Text>
				<Button
					title='Повторить'
					variant='secondary'
					size='sm'
					onPress={onRetry}
					icon={<RefreshCw size={14} color={colors.secondaryForeground} />}
					style={styles.retryButton}
				/>
			</View>
		)
	}

	return <>{children}</>
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: spacing['2xl'],
	},
	title: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.lg,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		marginTop: spacing.lg,
		textAlign: 'center',
	},
	message: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
		marginTop: spacing.sm,
		textAlign: 'center',
		maxWidth: 280,
	},
	retryButton: {
		marginTop: spacing.xl,
		minWidth: 140,
	},
})
