'use client'

import { useCallback, useMemo } from 'react'
import { useAtom } from 'jotai'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/authclient'
import { anonymousCompareAtom } from '@/lib/store/anonymous'
import { useAnonymousDataSync } from '@/features/shared/useanonymousdatasync'

type ServerCompareItem = RouterOutputs['compare']['getAll'][number]

export function useCompare() {
	const { data: session } = authClient.useSession()
	const isAuth = !!session?.user
	const utils = trpc.useUtils()

	// Server compare (auth)
	const { data: serverCompare } = trpc.compare.getAll.useQuery(undefined, {
		enabled: isAuth,
	})
	const toggleMut = trpc.compare.toggle.useMutation({
		onSuccess: () => utils.compare.getAll.invalidate(),
	})
	const removeMut = trpc.compare.remove.useMutation({
		onSuccess: () => utils.compare.getAll.invalidate(),
	})
	const clearMut = trpc.compare.clear.useMutation({
		onSuccess: () => utils.compare.getAll.invalidate(),
	})

	// Anon compare (localStorage via Jotai)
	const [anonCompare, setAnonCompare] = useAtom(anonymousCompareAtom)

	useAnonymousDataSync({
		syncKey: 'compare',
		isAuth,
		items: anonCompare,
		clearLocal: () => setAnonCompare([]),
		migrateItem: toggleMut.mutateAsync,
	})

	// Unified product IDs list
	const productIds = useMemo<string[]>(
		() =>
			isAuth
				? (serverCompare?.map((compareItem: ServerCompareItem) => compareItem.productId) ?? [])
				: anonCompare,
		[isAuth, serverCompare, anonCompare],
	)

	const toggle = useCallback(
		(productId: string) => {
			if (isAuth) {
				toggleMut.mutate(productId)
			} else {
				setAnonCompare(prev =>
					prev.includes(productId)
						? prev.filter(id => id !== productId)
						: [...prev, productId],
				)
			}
		},
		[isAuth, toggleMut, setAnonCompare],
	)

	const remove = useCallback(
		(productId: string) => {
			if (isAuth) {
				removeMut.mutate(productId)
			} else {
				setAnonCompare(prev => prev.filter(id => id !== productId))
			}
		},
		[isAuth, removeMut, setAnonCompare],
	)

	const clear = useCallback(() => {
		setAnonCompare([])
		if (isAuth) {
			clearMut.mutate()
		}
	}, [isAuth, clearMut, setAnonCompare])

	const has = useCallback(
		(productId: string) => productIds.includes(productId),
		[productIds],
	)

	return {
		productIds,
		serverCompare: serverCompare ?? [],
		toggle,
		remove,
		clear,
		has,
		count: productIds.length,
		isAuth,
	}
}
