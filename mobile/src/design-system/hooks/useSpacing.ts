import { useMemo } from 'react'
import { type ViewStyle } from 'react-native'
import { spacing } from '../tokens'

type SpacingToken = keyof typeof spacing

interface SpacingConfig {
	/** Горизонтальные отступы экрана (default: 'lg' = 16px) */
	horizontal?: SpacingToken
	/** Вертикальные отступы секций (default: 'xl' = 24px) */
	sectionGap?: SpacingToken
	/** Отступы между элементами (default: 'sm' = 8px) */
	itemGap?: SpacingToken
}

/**
 * Хук для стандартизированных отступов на экранах.
 *
 * Гарантирует одинаковые отступы на всех экранах, устраняя
 * произвольные значения (px-4, p-5, и т.д.).
 *
 * @example
 * const { screen, section, item } = useSpacing()
 * <View style={screen}>
 *   <View style={section}>...</View>
 * </View>
 */
export function useSpacing(config?: SpacingConfig) {
	const horizontal = config?.horizontal ?? 'lg'
	const sectionGap = config?.sectionGap ?? 'xl'
	const itemGap = config?.itemGap ?? 'sm'

	return useMemo(() => {
		const screen: ViewStyle = {
			paddingHorizontal: spacing[horizontal],
		}

		const section: ViewStyle = {
			paddingTop: spacing[sectionGap],
		}

		const item: ViewStyle = {
			gap: spacing[itemGap],
		}

		const contentPadding: ViewStyle = {
			padding: spacing[horizontal],
			paddingTop: spacing.xs,
		}

		return {
			screen,
			section,
			item,
			contentPadding,
			/** Raw spacing values для inline использования */
			values: {
				horizontal: spacing[horizontal],
				sectionGap: spacing[sectionGap],
				itemGap: spacing[itemGap],
			},
		}
	}, [horizontal, sectionGap, itemGap])
}
