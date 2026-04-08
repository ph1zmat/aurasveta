'use client'

import { useEffect } from 'react'
import { addRecentlyViewed } from '@/shared/lib/recentlyViewed'

export default function TrackRecentlyViewed({ productId }: { productId: string }) {
	useEffect(() => {
		addRecentlyViewed(productId)
	}, [productId])
	return null
}
