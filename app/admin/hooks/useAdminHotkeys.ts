'use client'

import { useEffect, useMemo } from 'react'
import {
	getHotkeyManager,
	toHotkeyRegistrationView,
	type HotkeyCallback,
	type HotkeyOptions,
	type HotkeyRegistrationView,
	type RegisterableHotkey,
} from '@tanstack/hotkeys'
import { useStore } from '@tanstack/react-store'

export interface AdminHotkeyDefinition {
	hotkey: RegisterableHotkey
	callback: HotkeyCallback
	options?: HotkeyOptions
}

export function useAdminHotkeys(definitions: AdminHotkeyDefinition[]) {
	const manager = useMemo(() => getHotkeyManager(), [])

	useEffect(() => {
		const handles = definitions.map(definition =>
			manager.register(definition.hotkey, definition.callback, {
				conflictBehavior: 'replace',
				...definition.options,
			}),
		)

		return () => {
			handles.forEach(handle => handle.unregister())
		}
	}, [definitions, manager])
}

export function useAdminHotkeyRegistrations() {
	const manager = useMemo(() => getHotkeyManager(), [])
	const registrations = useStore(manager.registrations, state => state)

	return useMemo<HotkeyRegistrationView[]>(() => {
		return Array.from(registrations.values())
			.map(registration => toHotkeyRegistrationView(registration))
			.sort((left, right) => {
				const leftLabel = left.options.meta?.name ?? left.hotkey
				const rightLabel = right.options.meta?.name ?? right.hotkey

				return leftLabel.localeCompare(rightLabel, 'ru')
			})
	}, [registrations])
}
