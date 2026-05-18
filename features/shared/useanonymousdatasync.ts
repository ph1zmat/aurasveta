'use client'

import { useEffect, useRef } from 'react'

const activeAnonymousSyncKeys = new Set<string>()

interface UseAnonymousDataSyncOptions<TItem> {
	syncKey: string
	isAuth: boolean
	items: TItem[]
	clearLocal: () => void
	migrateItem: (item: TItem) => Promise<unknown>
}

/**
 * Синхронизирует локальную анонимную коллекцию с сервером после логина.
 */
export function useAnonymousDataSync<TItem>({
	syncKey,
	isAuth,
	items,
	clearLocal,
	migrateItem,
}: UseAnonymousDataSyncOptions<TItem>) {
	const syncedRef = useRef(false)

	useEffect(() => {
		if (!isAuth || items.length === 0) {
			syncedRef.current = false
			return
		}

		if (syncedRef.current || activeAnonymousSyncKeys.has(syncKey)) {
			return
		}

		syncedRef.current = true
		activeAnonymousSyncKeys.add(syncKey)
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
			} finally {
				activeAnonymousSyncKeys.delete(syncKey)
			}
		}

		void sync()

		return () => {
			cancelled = true
		}
	}, [clearLocal, isAuth, items, migrateItem, syncKey])
}
