'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAtom } from 'jotai'
import { trpc, type RouterOutputs } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/auth-client'
import { anonymousFavoritesAtom } from '@/lib/store/anonymous'

type ServerFavoriteItem = RouterOutputs['favorites']['getAll'][number]

export function useFavorites() {
	const { data: session } = authClient.useSession()
	const isAuth = !!session?.user
	const utils = trpc.useUtils()

	// Server favorites (auth)
	const { data: serverFavorites } = trpc.favorites.getAll.useQuery(undefined, {
		enabled: isAuth,
	})
	const toggleMut = trpc.favorites.toggle.useMutation({
		onSuccess: () => utils.favorites.getAll.invalidate(),
	})
	const removeMut = trpc.favorites.remove.useMutation({
		onSuccess: () => utils.favorites.getAll.invalidate(),
	})

	// Anon favorites (localStorage via Jotai)
	const [anonFavorites, setAnonFavorites] = useAtom(anonymousFavoritesAtom)

	// Sync anon → server on login
	const syncedRef = useRef(false)
	useEffect(() => {
		if (isAuth && anonFavorites.length > 0 && !syncedRef.current) {
			syncedRef.current = true
			const items = [...anonFavorites]
			Promise.all(items.map(id => toggleMut.mutateAsync(id)))
				.then(() => setAnonFavorites([]))
				.catch(() => {
					syncedRef.current = false
				})
		}
	}, [isAuth]) // eslint-disable-line react-hooks/exhaustive-deps

	// Unified product IDs list
	const productIds = useMemo<string[]>(
		() =>
			isAuth
				? (serverFavorites?.map((favorite: ServerFavoriteItem) => favorite.productId) ?? [])
				: anonFavorites,
		[isAuth, serverFavorites, anonFavorites],
	)

	const toggle = useCallback(
		(productId: string) => {
			if (isAuth) {
				toggleMut.mutate(productId)
			} else {
				setAnonFavorites(prev =>
					prev.includes(productId)
						? prev.filter(id => id !== productId)
						: [...prev, productId],
				)
			}
		},
		[isAuth, toggleMut, setAnonFavorites],
	)

	const remove = useCallback(
		(productId: string) => {
			if (isAuth) {
				removeMut.mutate(productId)
			} else {
				setAnonFavorites(prev => prev.filter(id => id !== productId))
			}
		},
		[isAuth, removeMut, setAnonFavorites],
	)

	const clear = useCallback(() => {
		if (isAuth && serverFavorites) {
			serverFavorites.forEach((favorite: ServerFavoriteItem) =>
				removeMut.mutate(favorite.productId),
			)
		} else {
			setAnonFavorites([])
		}
	}, [isAuth, serverFavorites, removeMut, setAnonFavorites])

	const has = useCallback(
		(productId: string) => productIds.includes(productId),
		[productIds],
	)

	return {
		productIds,
		serverFavorites: serverFavorites ?? [],
		toggle,
		remove,
		clear,
		has,
		count: productIds.length,
		isAuth,
	}
}
