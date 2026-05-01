import { useMemo, useState } from 'react'
import {
	View,
	Text,
	ScrollView,
	Pressable,
	StyleSheet,
	Platform,
	Switch,
	ActivityIndicator,
	Alert,
} from 'react-native'
import { trpc } from '../lib/trpc'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Tabs } from '../components/ui/Tabs'
import { Select } from '../components/ui/Select'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { IconButton } from '../components/ui/IconButton'
import { Input } from '../components/ui/Input'
import { useToast } from '../components/ui/Toast'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
	elevation,
} from '../theme'
import {
	Globe,
	ChevronUp,
	ChevronDown,
	Trash2,
	Plus,
	Save,
	AlertCircle,
} from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MoreStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<MoreStackParamList, 'Navigation'>
type NavZone = 'HEADER' | 'FOOTER'

const ZONE_TABS = [
	{ key: 'HEADER', label: 'Хедер' },
	{ key: 'FOOTER', label: 'Футер' },
]

type DraftNavItem = {
	id: string
	pageId: string
	labelOverride: string | null
	isActive: boolean
	order: number
}

type PageOption = {
	id: string
	title: string
	slug: string
}

function normalizeOrder(items: DraftNavItem[]): DraftNavItem[] {
	return items.map((item, i) => ({ ...item, order: i }))
}

function normalizeSnapshot(items: DraftNavItem[]) {
	return normalizeOrder(items).map(item => ({
		pageId: item.pageId,
		labelOverride: item.labelOverride?.trim() || null,
		isActive: item.isActive,
	}))
}

function createDraft(pageId: string, order: number): DraftNavItem {
	return {
		id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		pageId,
		labelOverride: null,
		isActive: true,
		order,
	}
}

function ZoneEditor({ zone }: { zone: NavZone }) {
	const [draftItemsState, setDraftItemsState] = useState<DraftNavItem[] | null>(null)
	const [selectedPageId, setSelectedPageId] = useState('')
	const utils = trpc.useUtils()
	const { showToast } = useToast()

	const { data, isLoading, isError, error, refetch, isRefetching } =
		trpc.siteNav.getEditorState.useQuery(
			{ zone },
			{ staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false },
		)

	const { mutate: saveZone, isPending: isSaving } = trpc.siteNav.replaceZone.useMutation({
		onSuccess: async () => {
			showToast('Изменения сохранены', 'success')
			setDraftItemsState(null)
			await utils.siteNav.getEditorState.invalidate({ zone })
		},
		onError: err => {
			showToast(err.message || 'Ошибка при сохранении', 'error')
		},
	})

	const sourceItems = useMemo<DraftNavItem[]>(() => {
		return [...(data?.items ?? [])]
			.sort((a, b) => a.order - b.order)
			.map(item => ({
				id: item.id,
				pageId: item.pageId,
				labelOverride: item.labelOverride,
				isActive: item.isActive,
				order: item.order,
			}))
	}, [data?.items])

	const draftItems = draftItemsState ?? sourceItems
	const pages: PageOption[] = useMemo(() => data?.pages ?? [], [data?.pages])
	const pageById = useMemo(() => new Map(pages.map(p => [p.id, p])), [pages])
	const usedPageIds = useMemo(() => new Set(draftItems.map(i => i.pageId)), [draftItems])

	const hasChanges = useMemo(() => {
		if (!data) return false
		return (
			JSON.stringify(normalizeSnapshot(draftItems)) !==
			JSON.stringify(normalizeSnapshot(sourceItems))
		)
	}, [data, draftItems, sourceItems])

	const pageOptions = useMemo(
		() =>
			pages.map(page => ({
				label: `${page.title} (/${page.slug})`,
				value: page.id,
			})),
		[pages],
	)

	const addItem = () => {
		if (!selectedPageId) return
		if (usedPageIds.has(selectedPageId)) {
			showToast('Эта страница уже добавлена в зону', 'error')
			return
		}
		setDraftItemsState(prev => {
			const base = prev ?? sourceItems
			return [...base, createDraft(selectedPageId, base.length)]
		})
		setSelectedPageId('')
	}

	const removeItem = (id: string) => {
		Alert.alert('Удалить ссылку?', 'Ссылка будет убрана из навигации.', [
			{ text: 'Отмена', style: 'cancel' },
			{
				text: 'Удалить',
				style: 'destructive',
				onPress: () => {
					setDraftItemsState(prev =>
						normalizeOrder((prev ?? sourceItems).filter(item => item.id !== id)),
					)
				},
			},
		])
	}

	const moveItem = (id: string, direction: 'up' | 'down') => {
		setDraftItemsState(prev => {
			const base = prev ?? sourceItems
			const idx = base.findIndex(item => item.id === id)
			if (idx < 0) return base
			const next = direction === 'up' ? idx - 1 : idx + 1
			if (next < 0 || next >= base.length) return base
			const arr = [...base]
			;[arr[idx], arr[next]] = [arr[next], arr[idx]]
			return normalizeOrder(arr)
		})
	}

	const updateItem = (
		id: string,
		patch: Partial<Pick<DraftNavItem, 'pageId' | 'labelOverride' | 'isActive'>>,
	) => {
		setDraftItemsState(prev =>
			(prev ?? sourceItems).map(item =>
				item.id === id ? { ...item, ...patch } : item,
			),
		)
	}

	const save = () => {
		saveZone({
			zone,
			items: normalizeOrder(draftItems).map(item => ({
				pageId: item.pageId,
				labelOverride: item.labelOverride,
				isActive: item.isActive,
			})),
		})
	}

	if (isLoading || isRefetching) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator color={colors.primary} />
				<Text style={styles.loadingText}>Загрузка навигации...</Text>
			</View>
		)
	}

	if (isError) {
		return (
			<View style={styles.centered}>
				<AlertCircle size={28} color={colors.destructive} />
				<Text style={styles.errorText}>
					{(error as Error)?.message || 'Не удалось загрузить навигацию'}
				</Text>
				<Button label='Повторить' onPress={() => refetch()} variant='ghost' />
			</View>
		)
	}

	return (
		<View style={styles.zoneContainer}>
			{/* Add page row */}
			<Card style={styles.addCard} elevationLevel={1}>
				<Text style={styles.sectionLabel}>Добавить страницу</Text>
				<Select
					options={pageOptions}
					value={selectedPageId}
					onValueChange={setSelectedPageId}
					placeholder='Выберите опубликованную страницу...'
					containerStyle={styles.selectContainer}
				/>
				<Button
					label='Добавить'
					onPress={addItem}
					disabled={!selectedPageId}
					size='sm'
					leftIcon={<Plus size={16} color={colors.primaryForeground} />}
				/>
			</Card>

			{/* Items list */}
			{draftItems.length === 0 ? (
				<EmptyState
					icon={<Globe size={36} color={colors.mutedForeground} />}
					title='Нет ссылок'
					description='Добавьте опубликованные страницы в навигацию'
				/>
			) : (
				<View style={styles.itemsList}>
					{draftItems.map((item, idx) => {
						const page = pageById.get(item.pageId)
						return (
							<Card key={item.id} style={styles.itemCard} elevationLevel={1}>
								{/* Reorder buttons */}
								<View style={styles.reorderCol}>
									<IconButton
										icon={<ChevronUp size={18} color={colors.mutedForeground} />}
										onPress={() => moveItem(item.id, 'up')}
										disabled={idx === 0}
										size='sm'
										variant='ghost'
										accessibilityLabel='Переместить вверх'
									/>
									<IconButton
										icon={<ChevronDown size={18} color={colors.mutedForeground} />}
										onPress={() => moveItem(item.id, 'down')}
										disabled={idx === draftItems.length - 1}
										size='sm'
										variant='ghost'
										accessibilityLabel='Переместить вниз'
									/>
								</View>

								{/* Item info */}
								<View style={styles.itemContent}>
									<Select
										options={pageOptions.map(opt => ({
											...opt,
											label: opt.value !== item.pageId && usedPageIds.has(opt.value)
												? `${opt.label} (уже добавлена)`
												: opt.label,
										}))}
										value={item.pageId}
										onValueChange={nextPageId => {
											if (
												nextPageId !== item.pageId &&
												usedPageIds.has(nextPageId)
											) {
												showToast('Эта страница уже есть в зоне', 'error')
												return
											}
											updateItem(item.id, { pageId: nextPageId })
										}}
										containerStyle={styles.selectContainer}
									/>
									<Input
										label=''
										placeholder={page?.title ?? 'Метка (необязательно)'}
										value={item.labelOverride ?? ''}
										onChangeText={val =>
											updateItem(item.id, { labelOverride: val || null })
										}
										containerStyle={styles.labelInput}
									/>
									<View style={styles.toggleRow}>
										<Text style={styles.toggleLabel}>Активна</Text>
										<Switch
											value={item.isActive}
											onValueChange={checked =>
												updateItem(item.id, { isActive: checked })
											}
											trackColor={{
												false: colors.muted,
												true: colors.primary + '80',
											}}
											thumbColor={
												item.isActive ? colors.primary : colors.mutedForeground
											}
										/>
									</View>
								</View>

								{/* Delete */}
								<IconButton
									icon={<Trash2 size={18} color={colors.destructive} />}
									onPress={() => removeItem(item.id)}
									size='sm'
									variant='ghost'
									accessibilityLabel='Удалить ссылку'
								/>
							</Card>
						)
					})}
				</View>
			)}

			{/* Save footer */}
			{hasChanges && (
				<View style={styles.saveBar}>
					<Text style={styles.changesHint}>Есть несохранённые изменения</Text>
					<Button
						label={isSaving ? 'Сохранение...' : 'Сохранить'}
						onPress={save}
						disabled={isSaving}
						leftIcon={<Save size={16} color={colors.primaryForeground} />}
					/>
				</View>
			)}
		</View>
	)
}

export function NavigationScreen({ navigation }: Props) {
	const [activeZone, setActiveZone] = useState<NavZone>('HEADER')

	return (
		<View style={styles.root}>
			<ScreenHeader
				title='Навигация сайта'
				onBack={() => navigation.goBack()}
				icon={<Globe size={22} color={colors.primary} />}
			/>

			<Tabs
				tabs={ZONE_TABS}
				activeKey={activeZone}
				onSelect={key => setActiveZone(key as NavZone)}
				style={styles.tabs}
			/>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps='handled'
			>
				<ZoneEditor zone={activeZone} />
			</ScrollView>
		</View>
	)
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: colors.background,
	},
	tabs: {
		paddingHorizontal: spacing.md,
		paddingTop: spacing.sm,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		padding: spacing.md,
		paddingBottom: spacing.xl * 2,
	},
	zoneContainer: {
		gap: spacing.md,
	},
	addCard: {
		gap: spacing.sm,
		padding: spacing.md,
	},
	sectionLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		marginBottom: spacing.xs,
	},
	selectContainer: {
		marginBottom: spacing.xs,
	},
	itemsList: {
		gap: spacing.sm,
	},
	itemCard: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: spacing.sm,
		gap: spacing.sm,
	},
	reorderCol: {
		gap: spacing.xs,
		paddingTop: spacing.xs,
	},
	itemContent: {
		flex: 1,
		gap: spacing.xs,
	},
	labelInput: {
		marginBottom: 0,
	},
	toggleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: spacing.xs,
	},
	toggleLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
	},
	centered: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.sm,
		padding: spacing.lg,
	},
	loadingText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
	},
	errorText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.destructive,
		textAlign: 'center',
	},
	saveBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: spacing.md,
		backgroundColor: colors.card,
		borderRadius: borderRadius.xl,
		...Platform.select({
			ios: elevation(2),
			android: { elevation: 2 },
		}),
		gap: spacing.md,
	},
	changesHint: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
		flex: 1,
	},
})
