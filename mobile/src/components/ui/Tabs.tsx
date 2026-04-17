import { ScrollView, TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native'
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../theme'

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
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onSelect(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {tab.label}
              {tab.count != null ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
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
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.secondaryForeground,
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
})
