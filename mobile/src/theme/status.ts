import type { ComponentType } from 'react'
import {
	CircleDot,
	CreditCard,
	Truck,
	CheckCircle2,
	Ban,
} from 'lucide-react-native'
import { STATUS_COLORS, type StatusKey, colors } from './colors'

export const STATUS_ICONS: Record<StatusKey, ComponentType<any>> = {
	PENDING: CircleDot,
	PAID: CreditCard,
	SHIPPED: Truck,
	DELIVERED: CheckCircle2,
	CANCELLED: Ban,
}

export const FALLBACK_STATUS = {
	color: colors.mutedForeground,
	bg: colors.muted,
}

export function getStatusPresentation(status: string) {
	const key = status as StatusKey
	const cfg = STATUS_COLORS[key]
	if (!cfg) {
		return {
			label: status,
			color: FALLBACK_STATUS.color,
			bg: FALLBACK_STATUS.bg,
			Icon: CircleDot,
		}
	}

	return {
		...cfg,
		Icon: STATUS_ICONS[key],
	}
}