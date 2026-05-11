'use client'

import { useEffect, useState } from 'react'

const DESKTOP_QUERY = '(min-width: 1024px)'

/**
 * Returns the absolute Y coordinate of the bottom edge of an element.
 * Recalculates on resize. Returns `undefined` on mobile or if element not found.
 */
export function useElementBottomY(elementId: string): number | undefined {
	const [bottomY, setBottomY] = useState<number | undefined>(undefined)

	useEffect(() => {
		const mql = window.matchMedia(DESKTOP_QUERY)

		function calculate() {
			if (!mql.matches) {
				setBottomY(undefined)
				return
			}
			const el = document.getElementById(elementId)
			if (!el) {
				setBottomY(undefined)
				return
			}
			const rect = el.getBoundingClientRect()
			setBottomY(rect.bottom + window.scrollY)
		}

		calculate()

		const onResize = () => {
			calculate()
		}

		const onMediaChange = () => {
			calculate()
		}

		window.addEventListener('resize', onResize, { passive: true })
		mql.addEventListener('change', onMediaChange)

		return () => {
			window.removeEventListener('resize', onResize)
			mql.removeEventListener('change', onMediaChange)
		}
	}, [elementId])

	return bottomY
}
