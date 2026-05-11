'use client'

import { useEffect } from 'react'
import { addRecentlyViewed } from '@/shared/lib/recentlyviewed'
import { getTrackingSessionId } from '@/shared/lib/trackingsession'
import { trpc } from '@/lib/trpc/client'

export default function TrackRecentlyViewed({ productId }: { productId: string }) {
	const logView = trpc.recommendations.logProductView.useMutation()

	useEffect(() => {
		addRecentlyViewed(productId)
		const sessionId = getTrackingSessionId()
		if (sessionId) {
			logView.mutate({ productId, sessionId })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productId])

	return null
}
