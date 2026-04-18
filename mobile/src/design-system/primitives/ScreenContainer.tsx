import { type ReactNode } from 'react'
import { StyleSheet, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Box } from './Box'
import { colors, spacing } from '../tokens'

interface ScreenContainerProps {
	children: ReactNode
	/** Дополнительные стили */
	style?: ViewStyle
	/** Фон экрана (default: background) */
	bg?: string
	/** Отключить горизонтальные отступы (для экранов с FlatList) */
	noPadding?: boolean
	/** Учитывать safe area сверху */
	safeTop?: boolean
	/** Учитывать safe area снизу */
	safeBottom?: boolean
}

/**
 * Обёртка экрана — гарантирует единообразные:
 * - Фон: `colors.background`
 * - Горизонтальные отступы: `spacing.lg` (16px)
 * - SafeArea: опциональная поддержка
 *
 * @example
 * <ScreenContainer>
 *   <ScreenHeader title="Товары" icon={<Package />} />
 *   <FlatList ... />
 * </ScreenContainer>
 */
export function ScreenContainer({
	children,
	style,
	bg = colors.background,
	noPadding = false,
	safeTop = false,
	safeBottom = false,
}: ScreenContainerProps) {
	const insets = useSafeAreaInsets()

	return (
		<Box
			flex
			style={[
				styles.container,
				{ backgroundColor: bg },
				!noPadding && styles.padding,
				safeTop && { paddingTop: insets.top },
				safeBottom && { paddingBottom: insets.bottom },
				style,
			]}
		>
			{children}
		</Box>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	padding: {
		paddingHorizontal: spacing.lg,
	},
})
