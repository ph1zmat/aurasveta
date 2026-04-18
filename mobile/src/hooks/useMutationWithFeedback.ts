import { useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '../components/ui/Toast'
import * as Haptics from 'expo-haptics'

interface MutationFeedbackOptions<TInput, TData> {
	/** tRPC mutation hook result (e.g. trpc.products.update.useMutation()) */
	mutation: {
		mutateAsync: (input: TInput) => Promise<TData>
		isPending: boolean
		error: { message: string } | null
	}
	/** Query keys to invalidate on success */
	invalidateKeys?: unknown[][]
	/** Toast messages */
	successMessage?: string
	errorMessage?: string
	/** Callback on success */
	onSuccess?: (data: TData) => void
	/** Optimistic update callback — receives queryClient */
	onOptimistic?: (
		input: TInput,
		queryClient: ReturnType<typeof useQueryClient>,
	) => (() => void) | void
	/**
	 * Оптимистичное удаление из списка.
	 * Автоматически убирает элемент из кэша по ID до завершения мутации.
	 *
	 * @example
	 * optimisticListRemove: {
	 *   queryKey: ['products', 'list'],
	 *   getId: (input) => input.id,
	 *   getItemId: (item) => item.id,
	 * }
	 */
	optimisticListRemove?: {
		queryKey: unknown[]
		getId: (input: TInput) => string
		getItemId?: (item: any) => string
		/** Ключ массива внутри data (default: 'items', fallback: data как массив) */
		listKey?: string
	}
}

/**
 * Хук для мутаций tRPC с единой обработкой:
 * - Toast уведомления (success / error)
 * - Haptic feedback
 * - Автоинвалидация кэша
 * - Оптимистичные обновления (опционально)
 * - Оптимистичное удаление из списков (optimisticListRemove)
 *
 * @example
 * // Простая мутация
 * const { execute, isPending } = useMutationWithFeedback({
 *   mutation: trpc.products.update.useMutation(),
 *   invalidateKeys: [['products']],
 *   successMessage: 'Товар обновлён',
 * })
 *
 * // Оптимистичное удаление из списка
 * const { execute: deleteProduct } = useMutationWithFeedback({
 *   mutation: trpc.products.delete.useMutation(),
 *   invalidateKeys: [['products']],
 *   successMessage: 'Товар удалён',
 *   optimisticListRemove: {
 *     queryKey: ['products', 'list'],
 *     getId: (input) => input.id,
 *   },
 * })
 */
export function useMutationWithFeedback<TInput, TData>({
	mutation,
	invalidateKeys,
	successMessage,
	errorMessage,
	onSuccess,
	onOptimistic,
	optimisticListRemove,
}: MutationFeedbackOptions<TInput, TData>) {
	const queryClient = useQueryClient()
	const { showToast } = useToast()
	const pendingRef = useRef(false)

	const execute = useCallback(
		async (input: TInput) => {
			if (pendingRef.current) return
			pendingRef.current = true

			const rollbacks: Array<() => void> = []

			// Apply custom optimistic update
			if (onOptimistic) {
				const result = onOptimistic(input, queryClient)
				if (typeof result === 'function') rollbacks.push(result)
			}

			// Apply optimistic list removal
			if (optimisticListRemove) {
				const { queryKey, getId, getItemId, listKey = 'items' } =
					optimisticListRemove
				const targetId = getId(input)
				const itemId = getItemId ?? ((item: any) => item.id)

				const prevData = queryClient.getQueryData(queryKey)

				queryClient.setQueryData(queryKey, (old: any) => {
					if (!old) return old

					// Data is a plain array
					if (Array.isArray(old)) {
						return old.filter((item: any) => itemId(item) !== targetId)
					}

					// Data is an object with a list key (e.g. { items: [...], total: N })
					if (old[listKey] && Array.isArray(old[listKey])) {
						return {
							...old,
							[listKey]: old[listKey].filter(
								(item: any) => itemId(item) !== targetId,
							),
							...(typeof old.total === 'number'
								? { total: Math.max(0, old.total - 1) }
								: {}),
						}
					}

					return old
				})

				rollbacks.push(() => queryClient.setQueryData(queryKey, prevData))
			}

			try {
				const data = await mutation.mutateAsync(input)

				// Haptic feedback on success
				Haptics.notificationAsync(
					Haptics.NotificationFeedbackType.Success,
				).catch(() => {})

				if (successMessage) showToast(successMessage, 'success')

				// Invalidate related queries
				if (invalidateKeys) {
					await Promise.all(
						invalidateKeys.map(key =>
							queryClient.invalidateQueries({ queryKey: key }),
						),
					)
				}

				onSuccess?.(data)
				return data
			} catch (err: any) {
				// Rollback all optimistic updates
				rollbacks.forEach(rollback => rollback())

				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
					() => {},
				)
				showToast(errorMessage || err?.message || 'Произошла ошибка', 'error')
				throw err
			} finally {
				pendingRef.current = false
			}
		},
		[
			mutation,
			queryClient,
			invalidateKeys,
			successMessage,
			errorMessage,
			onSuccess,
			onOptimistic,
			optimisticListRemove,
			showToast,
		],
	)

	return {
		execute,
		isPending: mutation.isPending,
		error: mutation.error,
	}
}
