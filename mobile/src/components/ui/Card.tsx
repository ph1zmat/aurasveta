import { View, StyleSheet, type ViewStyle, type ReactNode } from 'react-native'
import { colors, borderRadius, spacing } from '../../theme'

interface CardProps {
  children: ReactNode
  style?: ViewStyle
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
})
