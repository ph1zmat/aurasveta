'use client'

import { useElementBottomY } from '@/shared/lib/useElementBottomY'
import StickyProductHeader from './StickyProductHeader'

interface StickyHeaderWithTriggerProps {
	triggerId: string
	name: string
	image: string
	price: number
	discountPercent?: number
	bonusAmount?: number
	actionLabel?: string
	actionHref?: string
}

export default function StickyHeaderWithTrigger({
	triggerId,
	...headerProps
}: StickyHeaderWithTriggerProps) {
	const showAtY = useElementBottomY(triggerId)
	return <StickyProductHeader {...headerProps} showAtY={showAtY} />
}
