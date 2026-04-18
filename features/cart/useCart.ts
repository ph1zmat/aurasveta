'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useAtom } from 'jotai'
import { trpc } from '@/lib/trpc/client'
import { authClient } from '@/lib/auth/auth-client'
import {
	anonymousCartAtom,
	type AnonymousCartItem,
} from '@/lib/store/anonymous'

export function useCart() {
	const { data: session } = authClient.useSession()
	const isAuth = !!session?.user
	const utils = trpc.useUtils()

	// Server cart (auth)
	const { data: serverItems } = trpc.cart.get.useQuery(undefined, {
		enabled: isAuth,
	})
	const updateMut = trpc.cart.update.useMutation({
		onSuccess: () => utils.cart.get.invalidate(),
	})
	const addItemMut = trpc.cart.addItem.useMutation({
		onSuccess: () => utils.cart.get.invalidate(),
	})
	const removeItemMut = trpc.cart.removeItem.useMutation({
		onSuccess: () => utils.cart.get.invalidate(),
	})
	const clearMut = trpc.cart.clear.useMutation({
		onSuccess: () => utils.cart.get.invalidate(),
	})

	// Anon cart (localStorage via Jotai)
	const [anonCart, setAnonCart] = useAtom(anonymousCartAtom)

	// Sync anon → server on login
	const syncedRef = useRef(false)
	useEffect(() => {
		if (isAuth && anonCart.length > 0 && !syncedRef.current) {
			syncedRef.current = true
			const items = [...anonCart]
			// Add each anon cart item to server cart
			Promise.all(items.map(item => addItemMut.mutateAsync(item)))
				.then(() => setAnonCart([]))
				.catch(() => {
					syncedRef.current = false
				})
		}
	}, [isAuth]) // eslint-disable-line react-hooks/exhaustive-deps

	const rawItems: AnonymousCartItem[] = isAuth
		? (serverItems ?? []).map(item => ({
				productId: typeof item === 'object' && item !== null && 'productId' in item
					? String((item as Record<string, unknown>).productId)
					: '',
				quantity: typeof item === 'object' && item !== null && 'quantity' in item
					? Number((item as Record<string, unknown>).quantity)
					: 1,
			}))
		: anonCart

	// Expose enriched items with product data from cart.get (auth only)
	const serverCartWithProducts = isAuth ? (serverItems ?? []) : []

	const add = useCallback(
		(productId: string, quantity = 1) => {
			if (isAuth) {
				addItemMut.mutate({ productId, quantity })
			} else {
				setAnonCart(prev => {
					const idx = prev.findIndex(i => i.productId === productId)
					if (idx >= 0) {
						const next = [...prev]
						next[idx] = {
							...next[idx],
							quantity: next[idx].quantity + quantity,
						}
						return next
					}
					return [...prev, { productId, quantity }]
				})
			}
		},
		[isAuth, addItemMut, setAnonCart],
	)

	const remove = useCallback(
		(productId: string) => {
			if (isAuth) {
				removeItemMut.mutate(productId)
			} else {
				setAnonCart(prev => prev.filter(i => i.productId !== productId))
			}
		},
		[isAuth, removeItemMut, setAnonCart],
	)

	const updateQuantity = useCallback(
		(productId: string, quantity: number) => {
			if (quantity < 1) return
			if (isAuth) {
				const updated = rawItems.map(i =>
					i.productId === productId ? { ...i, quantity } : i,
				)
				updateMut.mutate(updated)
			} else {
				setAnonCart(prev =>
					prev.map(i => (i.productId === productId ? { ...i, quantity } : i)),
				)
			}
		},
		[isAuth, rawItems, updateMut, setAnonCart],
	)

	const clear = useCallback(() => {
		if (isAuth) {
			clearMut.mutate()
		} else {
			setAnonCart([])
		}
	}, [isAuth, clearMut, setAnonCart])

	const has = useCallback(
		(productId: string) => rawItems.some(i => i.productId === productId),
		[rawItems],
	)

	const count = rawItems.reduce((sum, i) => sum + i.quantity, 0)

	return {
		items: rawItems,
		serverCartWithProducts,
		add,
		remove,
		updateQuantity,
		clear,
		has,
		count,
		isAuth,
	}
}
