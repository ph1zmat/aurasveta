/**
 * Noir Ligne — Status Contract (Package B · status-contract)
 * Source-of-truth for order status types, labels, and visual config.
 *
 * Web/Desktop: import { STATUS_CONFIG, getStatusConfig, type OrderStatus } from '@/shared/lib/status'
 * Mobile: colours come from mobile/src/theme/colors.ts (STATUS_COLORS);
 *         icons via mobile/src/theme/status.ts.
 *         This module defines the type contract shared across platforms.
 */

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export interface StatusConfig {
  /** Human-readable label */
  label: string
  /** Sort order for UI lists */
  order: number
  /**
   * Noir Ligne CSS variable names for web/desktop.
   * Mobile resolves colours via STATUS_COLORS in mobile/src/theme/colors.ts.
   */
  nlColor: string   // hex — Noir Ligne token
  nlBg: string      // hex — Noir Ligne token background
}

/** Ordered list of all possible statuses */
export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]

/**
 * Platform-agnostic status metadata.
 * Visual tokens (color / bg) use the Noir Ligne palette from
 * shared/design-tokens/noir-ligne.tokens.json → color.status.*
 */
export const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  PENDING: {
    label: 'Новый',
    order: 0,
    nlColor: '#D4940A',
    nlBg:    '#FDF6E3',
  },
  PAID: {
    label: 'Оплачен',
    order: 1,
    nlColor: '#2E9E6E',
    nlBg:    '#E6F5ED',
  },
  SHIPPED: {
    label: 'Отправлен',
    order: 2,
    nlColor: '#7C5ABF',
    nlBg:    '#F0EBF8',
  },
  DELIVERED: {
    label: 'Доставлен',
    order: 3,
    nlColor: '#3A8DB5',
    nlBg:    '#E5F2F8',
  },
  CANCELLED: {
    label: 'Отменён',
    order: 4,
    nlColor: '#C0392B',
    nlBg:    '#FBEAE8',
  },
}

/**
 * Returns config for a given status string.
 * Falls back gracefully for unknown values.
 */
export function getStatusConfig(status: string): StatusConfig & { key: OrderStatus | 'UNKNOWN' } {
  const key = status as OrderStatus
  if (STATUS_CONFIG[key]) {
    return { ...STATUS_CONFIG[key], key }
  }
  return {
    key: 'UNKNOWN',
    label: status,
    order: 99,
    nlColor: '#6C717D',
    nlBg:    '#ECE7E0',
  }
}

/**
 * Valid status transitions: defines which next statuses are reachable.
 * Used by both Desktop CMS (Orders.tsx) and Mobile (OrdersScreen / OrderDetail).
 */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING:   ['PAID', 'CANCELLED'],
  PAID:      ['SHIPPED', 'CANCELLED'],
  SHIPPED:   ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}
