import { useState, useEffect, useMemo } from 'react'
import {
	View,
	Text,
	FlatList,
	Pressable,
	StyleSheet,
	RefreshControl,
	Switch,
	Platform,
} from 'react-native'
import { trpc } from '../lib/trpc'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
	elevation,
	ripple,
} from '../theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Tabs } from '../components/ui/Tabs'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import {
	Globe,
	FileText,
	FolderTree,
	Package,
	Pencil,
	Check,
	CheckCircle,
	AlertCircle,
	Circle,
	ChevronLeft,
	ChevronRight,
	Search,
} from 'lucide-react-native'

type TargetType = 'product' | 'category' | 'page'
type EditTarget = { type: TargetType; id: string; name: string }

const TABS = [
	{ key: 'page', label: 'Страницы' },
	{ key: 'category', label: 'Категории' },
	{ key: 'product', label: 'Товары' },
]

/* ====== SEO status helper ====== */
function getSeoStatus(seoMap: Map<string, any>, targetId: string) {
	const rec = seoMap.get(targetId)
	if (!rec) return { status: 'empty' as const, filled: 0 }
	let filled = 0
	if (rec.title) filled++
	if (rec.description) filled++
	if (rec.keywords) filled++
	if (rec.ogTitle) filled++
	if (rec.ogDescription) filled++
	if (rec.ogImage) filled++
	if (rec.canonicalUrl) filled++
	const status =
		filled >= 3
			? ('good' as const)
			: filled > 0
				? ('partial' as const)
				: ('empty' as const)
	return { status, filled }
}

const STATUS_CFG = {
	good: { color: colors.seoGood, label: 'Настроено' },
	partial: { color: colors.seoPartial, label: 'Частично' },
	empty: { color: colors.seoEmpty, label: 'Пусто' },
}

/* ====== Main screen ====== */
export function SeoScreen() {
	const [activeTab, setActiveTab] = useState('page')
	const [search, setSearch] = useState('')
	const [editTarget, setEditTarget] = useState<EditTarget | null>(null)

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='SEO'
				showBack
				icon={
					<View style={styles.headerIcon}>
						<Globe size={20} color={colors.primaryForeground} />
					</View>
				}
			/>
			<View style={styles.tabsRow}>
				<Tabs
					tabs={TABS}
					activeKey={activeTab}
					onSelect={k => {
						setActiveTab(k)
						setSearch('')
					}}
				/>
			</View>
			<View style={styles.searchRow}>
				<SearchInput
					value={search}
					onChangeText={setSearch}
					placeholder='Поиск...'
				/>
			</View>

			{activeTab === 'page' && (
				<PagesTab search={search} onEdit={setEditTarget} />
			)}
			{activeTab === 'category' && (
				<CategoriesTab search={search} onEdit={setEditTarget} />
			)}
			{activeTab === 'product' && (
				<ProductsTab search={search} onEdit={setEditTarget} />
			)}

			{editTarget && (
				<SeoEditModal
					targetType={editTarget.type}
					targetId={editTarget.id}
					name={editTarget.name}
					onClose={() => setEditTarget(null)}
				/>
			)}
		</View>
	)
}

/* ====== Entity row component ====== */
function EntityRow({
	name,
	subtitle,
	seoMap,
	targetType,
	targetId,
	onEdit,
}: {
	name: string
	subtitle?: string
	seoMap: Map<string, any>
	targetType: TargetType
	targetId: string
	onEdit: () => void
}) {
	const { status, filled } = getSeoStatus(seoMap, targetId)
	const cfg = STATUS_CFG[status]
	const StatusIcon =
		status === 'good'
			? CheckCircle
			: status === 'partial'
				? AlertCircle
				: Circle

	return (
		<Pressable
			android_ripple={ripple.ghost}
			style={({ pressed }) => [
				styles.entityCard,
				elevation(1),
				Platform.OS === 'android'
					? { overflow: 'hidden' }
					: pressed
						? { opacity: 0.7 }
						: undefined,
			]}
			onPress={onEdit}
		>
			<View style={styles.entityLeft}>
				<View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
				<View style={styles.entityInfo}>
					<Text style={styles.entityName} numberOfLines={1}>
						{name}
					</Text>
					{subtitle ? (
						<Text style={styles.entitySlug} numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
				</View>
			</View>
			<View style={styles.entityRight}>
				<View
					style={[styles.statusBadge, { backgroundColor: cfg.color + '1A' }]}
				>
					<StatusIcon size={12} color={cfg.color} />
					<Text style={[styles.statusLabel, { color: cfg.color }]}>
						{filled}/7
					</Text>
				</View>
				<View style={styles.editBtn}>
					<Pencil size={16} color={colors.primary} />
				</View>
			</View>
		</Pressable>
	)
}

/* ====== Pages tab ====== */
function PagesTab({
	search,
	onEdit,
}: {
	search: string
	onEdit: (t: EditTarget) => void
}) {
	const { data: pages, refetch, isRefetching } = trpc.pages.getAll.useQuery()
	const { data: seoRecords } = trpc.seo.listAll.useQuery({ targetType: 'page' })

	const seoMap = useMemo(() => {
		const m = new Map<string, any>()
		;(seoRecords ?? []).forEach((r: any) => m.set(r.targetId, r))
		return m
	}, [seoRecords])

	const filtered = useMemo(() => {
		if (!pages) return []
		const q = search.toLowerCase()
		return pages.filter(
			(p: any) =>
				!q ||
				p.title?.toLowerCase().includes(q) ||
				p.slug?.toLowerCase().includes(q),
		)
	}, [pages, search])

	return (
		<FlatList
			data={filtered}
			keyExtractor={(item: any) => item.id}
			refreshControl={
				<RefreshControl
					refreshing={isRefetching}
					onRefresh={() => refetch()}
					tintColor={colors.primary}
				/>
			}
			contentContainerStyle={styles.list}
			renderItem={({ item }: { item: any }) => (
				<EntityRow
					name={item.title}
					subtitle={`/${item.slug}`}
					seoMap={seoMap}
					targetType='page'
					targetId={item.id}
					onEdit={() => onEdit({ type: 'page', id: item.id, name: item.title })}
				/>
			)}
			ListEmptyComponent={
				<EmptyState
					icon={<FileText size={36} color={colors.mutedForeground + '40'} />}
					title={search ? 'Не найдено' : 'Нет страниц'}
					description='Создайте страницы в разделе Страницы'
				/>
			}
		/>
	)
}

/* ====== Categories tab ====== */
function CategoriesTab({
	search,
	onEdit,
}: {
	search: string
	onEdit: (t: EditTarget) => void
}) {
	const {
		data: categories,
		refetch,
		isRefetching,
	} = trpc.categories.getAll.useQuery()
	const { data: seoRecords } = trpc.seo.listAll.useQuery({
		targetType: 'category',
	})

	const seoMap = useMemo(() => {
		const m = new Map<string, any>()
		;(seoRecords ?? []).forEach((r: any) => m.set(r.targetId, r))
		return m
	}, [seoRecords])

	const filtered = useMemo(() => {
		if (!categories) return []
		const q = search.toLowerCase()
		return categories.filter(
			(c: any) => !q || c.name?.toLowerCase().includes(q),
		)
	}, [categories, search])

	return (
		<FlatList
			data={filtered}
			keyExtractor={(item: any) => item.id}
			refreshControl={
				<RefreshControl
					refreshing={isRefetching}
					onRefresh={() => refetch()}
					tintColor={colors.primary}
				/>
			}
			contentContainerStyle={styles.list}
			renderItem={({ item }: { item: any }) => (
				<EntityRow
					name={item.name}
					subtitle={`/${item.slug}`}
					seoMap={seoMap}
					targetType='category'
					targetId={item.id}
					onEdit={() =>
						onEdit({ type: 'category', id: item.id, name: item.name })
					}
				/>
			)}
			ListEmptyComponent={
				<EmptyState
					icon={<FolderTree size={36} color={colors.mutedForeground + '40'} />}
					title={search ? 'Не найдено' : 'Нет категорий'}
				/>
			}
		/>
	)
}

/* ====== Products tab ====== */
function ProductsTab({
	search,
	onEdit,
}: {
	search: string
	onEdit: (t: EditTarget) => void
}) {
	const [page, setPage] = useState(1)
	const { data, refetch, isRefetching } = trpc.products.getMany.useQuery({
		page,
		limit: 30,
		search: search || undefined,
	})
	const { data: seoRecords } = trpc.seo.listAll.useQuery({
		targetType: 'product',
	})
	const items = data?.items ?? []
	const totalPages = data?.totalPages ?? 1

	useEffect(() => {
		setPage(1)
	}, [search])

	const seoMap = useMemo(() => {
		const m = new Map<string, any>()
		;(seoRecords ?? []).forEach((r: any) => m.set(r.targetId, r))
		return m
	}, [seoRecords])

	return (
		<View style={{ flex: 1 }}>
			<FlatList
				data={items}
				keyExtractor={(item: any) => item.id}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary}
					/>
				}
				contentContainerStyle={styles.list}
				renderItem={({ item }: { item: any }) => (
					<EntityRow
						name={item.name}
						subtitle={`/${item.slug}`}
						seoMap={seoMap}
						targetType='product'
						targetId={item.id}
						onEdit={() =>
							onEdit({ type: 'product', id: item.id, name: item.name })
						}
					/>
				)}
				ListEmptyComponent={
					<EmptyState
						icon={<Package size={36} color={colors.mutedForeground + '40'} />}
						title={search ? 'Не найдено' : 'Нет товаров'}
					/>
				}
			/>
			{totalPages > 1 && (
				<View style={styles.pagination}>
					<Pressable
						android_ripple={ripple.ghost}
						style={[
							styles.pageBtn,
							Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
						]}
						disabled={page <= 1}
						onPress={() => setPage(p => p - 1)}
					>
						<ChevronLeft
							size={16}
							color={page <= 1 ? colors.mutedForeground + '40' : colors.primary}
						/>
					</Pressable>
					<Text style={styles.pageText}>
						{page} / {totalPages}
					</Text>
					<Pressable
						android_ripple={ripple.ghost}
						style={[
							styles.pageBtn,
							Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
						]}
						disabled={page >= totalPages}
						onPress={() => setPage(p => p + 1)}
					>
						<ChevronRight
							size={16}
							color={
								page >= totalPages
									? colors.mutedForeground + '40'
									: colors.primary
							}
						/>
					</Pressable>
				</View>
			)}
		</View>
	)
}

/* ====== SEO Edit Modal ====== */
function SeoEditModal({
	targetType,
	targetId,
	name,
	onClose,
}: {
	targetType: TargetType
	targetId: string
	name: string
	onClose: () => void
}) {
	const { data, isLoading } = trpc.seo.getByTarget.useQuery({
		targetType,
		targetId,
	})
	const utils = trpc.useUtils()
	const updateMut = trpc.seo.update.useMutation({
		onSuccess: () => {
			utils.seo.getByTarget.invalidate({ targetType, targetId })
			utils.seo.listAll.invalidate({ targetType })
		},
	})

	const [form, setForm] = useState({
		title: '',
		description: '',
		keywords: '',
		ogTitle: '',
		ogDescription: '',
		ogImage: '',
		canonicalUrl: '',
		noIndex: false,
	})
	const [saved, setSaved] = useState(false)

	useEffect(() => {
		if (!data) return
		setForm({
			title: data.title ?? '',
			description: data.description ?? '',
			keywords: data.keywords ?? '',
			ogTitle: data.ogTitle ?? '',
			ogDescription: data.ogDescription ?? '',
			ogImage: data.ogImage ?? '',
			canonicalUrl: data.canonicalUrl ?? '',
			noIndex: !!data.noIndex,
		})
	}, [data])

	const typeLabels: Record<TargetType, string> = {
		page: 'Страница',
		category: 'Категория',
		product: 'Товар',
	}

	const onSave = async () => {
		setSaved(false)
		await updateMut.mutateAsync({
			targetType,
			targetId,
			title: form.title || null,
			description: form.description || null,
			keywords: form.keywords || null,
			ogTitle: form.ogTitle || null,
			ogDescription: form.ogDescription || null,
			ogImage: form.ogImage || null,
			canonicalUrl: form.canonicalUrl || null,
			noIndex: form.noIndex,
		})
		setSaved(true)
		setTimeout(() => setSaved(false), 2500)
	}

	return (
		<Modal visible onClose={onClose} title='SEO настройки'>
			<Text style={styles.modalSubtitle}>
				{typeLabels[targetType]}: {name}
			</Text>

			<Input
				label='Title'
				value={form.title}
				onChangeText={(v: string) => setForm(f => ({ ...f, title: v }))}
				placeholder='SEO заголовок'
				containerStyle={styles.field}
			/>
			<Input
				label='Description'
				value={form.description}
				onChangeText={(v: string) => setForm(f => ({ ...f, description: v }))}
				placeholder='SEO описание'
				multiline
				containerStyle={styles.field}
			/>
			<Input
				label='Keywords'
				value={form.keywords}
				onChangeText={(v: string) => setForm(f => ({ ...f, keywords: v }))}
				placeholder='ключевое, слово'
				containerStyle={styles.field}
			/>

			<Text style={styles.sectionTitle}>Open Graph</Text>
			<Input
				label='OG Title'
				value={form.ogTitle}
				onChangeText={(v: string) => setForm(f => ({ ...f, ogTitle: v }))}
				placeholder='Заголовок для соцсетей'
				containerStyle={styles.field}
			/>
			<Input
				label='OG Description'
				value={form.ogDescription}
				onChangeText={(v: string) => setForm(f => ({ ...f, ogDescription: v }))}
				placeholder='Описание для соцсетей'
				multiline
				containerStyle={styles.field}
			/>
			<Input
				label='OG Image'
				value={form.ogImage}
				onChangeText={(v: string) => setForm(f => ({ ...f, ogImage: v }))}
				placeholder='https://.../image.jpg'
				containerStyle={styles.field}
			/>
			<Input
				label='Canonical URL'
				value={form.canonicalUrl}
				onChangeText={(v: string) => setForm(f => ({ ...f, canonicalUrl: v }))}
				placeholder='https://...'
				containerStyle={styles.field}
			/>

			<View style={styles.noIndexRow}>
				<View style={{ flex: 1 }}>
					<Text
						style={[
							styles.noIndexLabel,
							form.noIndex && { color: colors.destructive },
						]}
					>
						noIndex
					</Text>
					<Text style={styles.noIndexHint}>
						{form.noIndex ? 'Скрыта от поисковиков' : 'Индексируется'}
					</Text>
				</View>
				<Switch
					value={form.noIndex}
					onValueChange={v => setForm(f => ({ ...f, noIndex: v }))}
					trackColor={{ false: colors.muted, true: colors.destructive + '80' }}
					thumbColor={form.noIndex ? colors.destructive : colors.card}
				/>
			</View>

			{saved && <Text style={styles.savedText}>Сохранено</Text>}

			<View style={styles.modalActions}>
				<Button title='Отмена' variant='outline' onPress={onClose} />
				<Button
					title='Сохранить'
					onPress={onSave}
					loading={updateMut.isPending}
					icon={<Check size={14} color={colors.primaryForeground} />}
				/>
			</View>
		</Modal>
	)
}

/* ====== Styles ====== */
const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	headerIcon: {
		width: 38,
		height: 38,
		borderRadius: borderRadius.md,
		backgroundColor: colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
	tabsRow: { paddingHorizontal: spacing.sm },
	searchRow: { paddingHorizontal: spacing.sm, marginBottom: spacing.xs },
	list: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xs,
		paddingBottom: spacing.xl,
	},
	entityCard: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		marginBottom: spacing.sm,
		borderWidth: 1,
		borderColor: colors.borderLight,
		...elevation(1),
	},
	entityLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		flex: 1,
		marginRight: spacing.sm,
	},
	statusDot: { width: 8, height: 8, borderRadius: 4 },
	entityInfo: { flex: 1 },
	entityName: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
	},
	entitySlug: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
		marginTop: 1,
	},
	entityRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
	statusBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: spacing.sm,
		paddingVertical: 3,
		borderRadius: borderRadius.sm,
	},
	statusLabel: {
		fontFamily: fontFamily.base,
		fontSize: 10,
		fontWeight: fontWeight.medium,
	},
	editBtn: {
		width: 36,
		height: 36,
		borderRadius: borderRadius.md,
		backgroundColor: colors.muted,
		justifyContent: 'center',
		alignItems: 'center',
	},
	pagination: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		gap: spacing.lg,
		paddingVertical: spacing.md,
	},
	pageBtn: {
		width: 44,
		height: 44,
		borderRadius: borderRadius.md,
		backgroundColor: colors.card,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.borderLight,
		...elevation(1),
	},
	pageText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
	},
	modalSubtitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
		marginBottom: spacing.lg,
	},
	field: { marginBottom: spacing.md },
	sectionTitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.semibold,
		color: colors.mutedForeground,
		letterSpacing: 1.5,
		textTransform: 'uppercase',
		marginTop: spacing.md,
		marginBottom: spacing.sm,
	},
	noIndexRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.muted + '30',
		borderRadius: borderRadius.md,
		padding: spacing.md,
		marginTop: spacing.md,
	},
	noIndexLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
	},
	noIndexHint: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
		marginTop: 2,
	},
	savedText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.seoGood,
		textAlign: 'center',
		marginTop: spacing.md,
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: spacing.sm,
		marginTop: spacing.lg,
	},
})
