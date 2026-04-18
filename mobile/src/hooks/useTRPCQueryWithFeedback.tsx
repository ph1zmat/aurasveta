import { type ReactNode } from 'react'
import { RetryBoundary } from '../components/ui/RetryBoundary'
import { EmptyState } from '../components/ui/EmptyState'

interface QueryFeedbackOptions<TData> {
	/** tRPC useQuery result */
	query: {
		data: TData | undefined
		isLoading: boolean
		error: { message: string } | null | undefined
		refetch: () => void
	}
	/** Skeleton для состояния загрузки (должен повторять форму контента) */
	skeleton: ReactNode
	/** Проверка пустоты данных (default: массив.length === 0) */
	isEmpty?: (data: TData) => boolean
	/** Конфигурация EmptyState */
	empty?: {
		icon?: ReactNode | string
		title: string
		description?: string
	}
}

interface QueryFeedbackResult<TData> {
	/** Данные (typed, never undefined внутри Success) */
	data: TData | undefined
	/** Компонент-обёртка: Loading → Error → Empty → children(data) */
	QueryContainer: (props: {
		children: (data: TData) => ReactNode
	}) => ReactNode
}

/**
 * Хук для стандартизации UI-состояний tRPC запросов.
 *
 * Автоматически рендерит:
 * - **Loading** → Skeleton
 * - **Error** → RetryBoundary (с кнопкой "Повторить")
 * - **Empty** → EmptyState
 * - **Success** → children(data)
 *
 * Гарантирует 100% одинаковый UI при загрузке на всех экранах.
 *
 * @example
 * const ordersQuery = trpc.orders.getAllOrders.useQuery({ page: 1, limit: 50 })
 *
 * const { QueryContainer } = useTRPCQueryWithFeedback({
 *   query: ordersQuery,
 *   skeleton: <>{[1,2,3].map(i => <SkeletonCard key={i} />)}</>,
 *   empty: { icon: '📦', title: 'Заказов нет', description: 'Заказы появятся здесь' },
 * })
 *
 * return (
 *   <View style={{ flex: 1 }}>
 *     <ScreenHeader title="Заказы" />
 *     <QueryContainer>
 *       {(data) => (
 *         <FlatList data={data.items} renderItem={...} />
 *       )}
 *     </QueryContainer>
 *   </View>
 * )
 */
export function useTRPCQueryWithFeedback<TData>({
	query,
	skeleton,
	isEmpty,
	empty,
}: QueryFeedbackOptions<TData>): QueryFeedbackResult<TData> {
	const { data, isLoading, error, refetch } = query

	const defaultIsEmpty = (d: TData): boolean => {
		if (Array.isArray(d)) return d.length === 0
		if (d && typeof d === 'object' && 'items' in d) {
			return Array.isArray((d as any).items) && (d as any).items.length === 0
		}
		return !d
	}

	const checkEmpty = isEmpty ?? defaultIsEmpty

	function QueryContainer({
		children,
	}: {
		children: (data: TData) => ReactNode
	}): ReactNode {
		return (
			<RetryBoundary
				isLoading={isLoading}
				error={error}
				onRetry={refetch}
				skeleton={skeleton}
			>
				{data !== undefined && checkEmpty(data) && empty ? (
					<EmptyState
						icon={empty.icon}
						title={empty.title}
						description={empty.description}
					/>
				) : data !== undefined ? (
					children(data)
				) : null}
			</RetryBoundary>
		)
	}

	return { data, QueryContainer }
}
