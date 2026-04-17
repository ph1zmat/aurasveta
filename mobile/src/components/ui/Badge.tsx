import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../theme'

interface BadgeProps {
  label: string
  color?: string
  bg?: string
  style?: ViewStyle
}

export function Badge({ label, color = colors.foreground, bg = colors.muted, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; bg: string; label: string }> = {
    PENDING:   { color: colors.statusPending, bg: colors.statusPendingBg, label: 'Ожидает' },
    PAID:      { color: colors.statusPaid, bg: colors.statusPaidBg, label: 'Оплачен' },
    SHIPPED:   { color: colors.statusShipped, bg: colors.statusShippedBg, label: 'Отправлен' },
    DELIVERED: { color: colors.statusDelivered, bg: colors.statusDeliveredBg, label: 'Доставлен' },
    CANCELLED: { color: colors.statusCancelled, bg: colors.statusCancelledBg, label: 'Отменён' },
  }
  const cfg = map[status] ?? { color: colors.mutedForeground, bg: colors.muted, label: status }
  return <Badge label={cfg.label} color={cfg.color} bg={cfg.bg} />
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
})
