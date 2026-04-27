'use client'

import { useEffect, useRef } from 'react'

interface UseAnonymousDataSyncOptions<TItem> {
	isAuth: boolean
	items: TItem[]
	clearLocal: () => void
	migrateItem: (item: TItem) => Promise<unknown>
}

/**
 * Синхронизирует локальную анонимную коллекцию с сервером после логина.
 */
export function useAnonymousDataSync<TItem>({
	isAuth,
	items,
	clearLocal,
	migrateItem,
}: UseAnonymousDataSyncOptions<TItem>) {
	const syncedRef = useRef(false)

	useEffect(() => {
		if (!isAuth || items.length === 0 || syncedRef.current) return

		syncedRef.current = true
		let cancelled = false

		const sync = async () => {
			try {
				for (const item of items) {
					if (cancelled) return
					await migrateItem(item)
				}

				if (!cancelled) clearLocal()
			} catch {
				syncedRef.current = false
			}
		}

		void sync()

		return () => {
			cancelled = true
		}
	}, [clearLocal, isAuth, items, migrateItem])
}