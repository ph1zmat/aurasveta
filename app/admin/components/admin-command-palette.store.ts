import { Store } from '@tanstack/store'

type AdminCommandPaletteState = {
	isOpen: boolean
}

export const adminCommandPaletteStore = new Store<AdminCommandPaletteState>({
	isOpen: false,
})

export function openAdminCommandPalette() {
	adminCommandPaletteStore.setState(state => ({ ...state, isOpen: true }))
}

export function closeAdminCommandPalette() {
	adminCommandPaletteStore.setState(state => ({ ...state, isOpen: false }))
}

export function toggleAdminCommandPalette() {
	adminCommandPaletteStore.setState(state => ({
		...state,
		isOpen: !state.isOpen,
	}))
}
