'use client'

import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export interface AnonymousCartItem {
	productId: string
	quantity: number
}

export const anonymousSessionIdAtom = atomWithStorage<string | null>(
	'aura-anon-session',
	null,
)

export const anonymousCartAtom = atomWithStorage<AnonymousCartItem[]>(
	'aura-anon-cart',
	[],
)

export const anonymousFavoritesAtom = atomWithStorage<string[]>(
	'aura-anon-favorites',
	[],
)

export const anonymousCompareAtom = atomWithStorage<string[]>(
	'aura-anon-compare',
	[],
)

export const isAuthenticatedAtom = atom(false)
