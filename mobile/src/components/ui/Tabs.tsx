import {
	ScrollView,
	Pressable,
	Text,
	StyleSheet,
	Platform,
	type ViewStyle,
} from 'react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
	ripple,
} from '../../theme'

interface Tab {
	key: string
	label: string
	count?: number
}

interface TabsProps {
	tabs: Tab[]
	activeKey: string
	onSelect: (key: string) => void
	style?: ViewStyle
}

export function Tabs({ tabs, activeKey, onSelect, style }: TabsProps) {
	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={[styles.container, style]}
		>
			{tabs.map(tab => {
				const active = tab.key === activeKey
				return (
					<Pressable
						key={tab.key}
						android_ripple={active ? ripple.primary : ripple.ghost}
						style={({ pressed }) => [
							styles.tab,
							active && styles.tabActive,
							Platform.OS === 'android'
								? { overflow: 'hidden' }
								: pressed
									? { opacity: 0.7 }
									: undefined,
						]}
						onPress={() => onSelect(tab.key)}
					>
						<Text style={[styles.tabText, active && styles.tabTextActive]}>
							{tab.label}
							{tab.count != null ? ` (${tab.count})` : ''}
						</Text>
					</Pressable>
				)
			})}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		gap: spacing.sm,
	},
	tab: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.md,
		backgroundColor: colors.secondary,
	},
	tabActive: {
		backgroundColor: colors.primary,
	},
	tabText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.secondaryForeground,
	},
	tabTextActive: {
		color: colors.primaryForeground,
	},
})
