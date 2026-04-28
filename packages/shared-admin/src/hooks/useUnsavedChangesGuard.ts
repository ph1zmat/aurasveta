import { useCallback, useEffect } from 'react'

const DEFAULT_MESSAGE =
	'У вас есть несохранённые изменения. Закрыть форму и потерять их?'

export function useUnsavedChangesGuard(
	isDirty: boolean,
	message = DEFAULT_MESSAGE,
) {
	useEffect(() => {
		if (!isDirty) return

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault()
			event.returnValue = message
			return message
		}

		window.addEventListener('beforeunload', handleBeforeUnload)
		return () => window.removeEventListener('beforeunload', handleBeforeUnload)
	}, [isDirty, message])

	return useCallback(() => {
		if (!isDirty) return true
		return window.confirm(message)
	}, [isDirty, message])
}
