/**
 * Design tokens converted from desktop OKLch values to HEX for React Native.
 * Source: desktop/src/index.css :root variables
 */
export const colors = {
  background: '#F5F0E8',      // oklch(0.9618 0.0208 88.72) — warm light beige
  foreground: '#5C4A3A',      // oklch(0.3795 0.0309 64.71) — dark warm brown
  card: '#FBF8F2',            // oklch(0.9914 0.0098 87.47) — near-white warm
  cardForeground: '#5C4A3A',
  primary: '#B07D40',         // oklch(0.6351 0.1052 63.86) — golden amber
  primaryForeground: '#FFFFFF',
  secondary: '#E8DCCA',       // oklch(0.8921 0.0415 85.28) — light warm tan
  secondaryForeground: '#6B5844',
  muted: '#E2D8CA',           // oklch(0.928 0.0263 82.38) — muted warm
  mutedForeground: '#8A7560', // oklch(0.5479 0.0538 71.42)
  accent: '#D9C9A5',          // oklch(0.8479 0.0584 89.65) — soft gold
  accentForeground: '#5C4A3A',
  destructive: '#C62828',     // oklch(0.5679 0.1914 32.99) — deep red
  destructiveForeground: '#FFFFFF',
  border: '#D4C4AA',          // oklch(0.8688 0.045 83.89) — warm border
  input: '#D4C4AA',
  ring: '#B07D40',            // same as primary

  // Status colors (matching desktop STATUS_CONFIG)
  statusPending: '#F59E0B',      // amber-500
  statusPendingBg: '#FEF3C7',   // amber-100
  statusPaid: '#3B82F6',         // blue-500
  statusPaidBg: '#DBEAFE',      // blue-100
  statusShipped: '#8B5CF6',      // violet-500
  statusShippedBg: '#EDE9FE',   // violet-100
  statusDelivered: '#10B981',    // emerald-500
  statusDeliveredBg: '#D1FAE5', // emerald-100
  statusCancelled: '#EF4444',    // red-500
  statusCancelledBg: '#FEE2E2', // red-100

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Badge type colors (properties)
  typeString: '#3B82F6',    // blue
  typeNumber: '#F59E0B',    // amber
  typeBoolean: '#10B981',   // emerald
  typeDate: '#8B5CF6',      // violet
  typeSelect: '#EC4899',    // rose

  // SEO status
  seoGood: '#10B981',
  seoPartial: '#F59E0B',
  seoEmpty: '#9CA3AF',
} as const

export type StatusKey = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export const STATUS_COLORS: Record<StatusKey, { color: string; bg: string; label: string }> = {
  PENDING:   { color: colors.statusPending, bg: colors.statusPendingBg, label: 'Ожидает' },
  PAID:      { color: colors.statusPaid, bg: colors.statusPaidBg, label: 'Оплачен' },
  SHIPPED:   { color: colors.statusShipped, bg: colors.statusShippedBg, label: 'Отправлен' },
  DELIVERED: { color: colors.statusDelivered, bg: colors.statusDeliveredBg, label: 'Доставлен' },
  CANCELLED: { color: colors.statusCancelled, bg: colors.statusCancelledBg, label: 'Отменён' },
}
