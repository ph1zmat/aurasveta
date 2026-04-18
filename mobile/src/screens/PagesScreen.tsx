import { useState, useMemo } from 'react'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import {
	View,
	Text,
	FlatList,
	Image,
	Pressable,
	StyleSheet,
	Alert,
	RefreshControl,
	Dimensions,
	Platform,
} from 'react-native'
import { trpc } from '../lib/trpc'
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
import { IconButton } from '../components/ui/IconButton'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { useToast } from '../components/ui/Toast'
import { FileText, Trash2, Pencil, Plus, Calendar } from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MoreStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<MoreStackParamList, 'Pages'>
const CARD_GAP = spacing.sm
const NUM_COLUMNS = 2

export function PagesScreen({ navigation }: Props) {
	const { data: pages, refetch, isRefetching } = trpc.pages.getAll.useQuery()
	const utils = trpc.useUtils()
	const { showToast } = useToast()
	const deleteMut = trpc.pages.delete.useMutation({
		onSuccess: () => {
			utils.pages.getAll.invalidate()
			showToast('Страница удалена', 'success')
		},
	})
	const [search, setSearch] = useState('')

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

	const screenWidth = Dimensions.get('window').width
	const cardWidth = (screenWidth - spacing.lg * 2 - CARD_GAP) / NUM_COLUMNS

	const handleDelete = (item: any) => {
		Alert.alert('Удалить?', `"${item.title}"`, [
			{ text: 'Отмена' },
			{
				text: 'Удалить',
				style: 'destructive',
				onPress: () => deleteMut.mutate(item.id),
			},
		])
	}

	const renderCard = ({ item, index }: { item: any; index: number }) => {
		const isLeft = index % 2 === 0
		const contentPreview = item.content
			? item.content.slice(0, 80) + (item.content.length > 80 ? '...' : '')
			: null
		const apiUrl = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'
		const imageUrl = item.imagePath
			? item.imagePath.startsWith('http')
				? item.imagePath
				: `${apiUrl}${item.imagePath}`
			: null

		return (
			<View
				style={[
					styles.card,
					{ width: cardWidth, marginRight: isLeft ? CARD_GAP : 0 },
				]}
			>
				{/* Cover area */}
				<View style={styles.coverArea}>
					{imageUrl ? (
						<Image
							source={{ uri: imageUrl }}
							style={styles.coverImage}
							resizeMode='cover'
						/>
					) : (
						<View style={styles.coverPlaceholder}>
							<FileText size={28} color={colors.mutedForeground + '30'} />
						</View>
					)}
					{/* Status dot */}
					<View
						style={[
							styles.statusDot,
							{
								backgroundColor: item.isPublished
									? colors.statusPaid
									: colors.statusPending,
							},
						]}
					/>
					{/* Actions overlay */}
					<View style={styles.cardActions}>
						<IconButton
							icon={<Pencil size={16} color={colors.primaryForeground} />}
							onPress={() => navigation.navigate('PageForm', { id: item.id })}
							accessibilityLabel='Редактировать'
							size='sm'
							variant='overlay'
						/>
						<IconButton
							icon={<Trash2 size={16} color={colors.primaryForeground} />}
							onPress={() => handleDelete(item)}
							accessibilityLabel='Удалить'
							size='sm'
							variant='overlay'
						/>
					</View>
				</View>

				{/* Content */}
				<View style={styles.cardBody}>
					<Text style={styles.cardTitle} numberOfLines={2}>
						{item.title}
					</Text>
					<Text style={styles.cardSlug} numberOfLines={1}>
						/{item.slug}
					</Text>
					{contentPreview && (
						<Text style={styles.cardPreview} numberOfLines={3}>
							{contentPreview}
						</Text>
					)}
					<View style={styles.cardFooter}>
						<Calendar size={11} color={colors.mutedForeground} />
						<Text style={styles.cardDate}>
							{new Date(item.createdAt).toLocaleDateString('ru-RU', {
								day: 'numeric',
								month: 'short',
								year: 'numeric',
							})}
						</Text>
					</View>
				</View>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='Страницы'
				showBack
				icon={
					<View style={styles.headerIcon}>
						<FileText size={20} color={colors.primaryForeground} />
					</View>
				}
				right={
					<Button
						title='Создать'
						size='sm'
						onPress={() => navigation.navigate('PageForm')}
						icon={<Plus size={14} color={colors.primaryForeground} />}
					/>
				}
			/>

			{pages && pages.length > 4 && (
				<SearchInput
					value={search}
					onChangeText={setSearch}
					placeholder='Поиск страниц...'
				/>
			)}

			<FlatList
				data={filtered}
				keyExtractor={(item: any) => item.id}
				numColumns={NUM_COLUMNS}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary}
					/>
				}
				contentContainerStyle={styles.list}
				renderItem={renderCard}
				ListEmptyComponent={
					<EmptyState
						icon={<FileText size={36} color={colors.mutedForeground + '40'} />}
						title={search ? 'Страницы не найдены' : 'Нет страниц'}
						description='Создайте первую страницу'
					/>
				}
			/>
		</View>
	)
}

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
	list: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
		paddingBottom: spacing.xl,
	},
	card: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		overflow: 'hidden',
		marginBottom: CARD_GAP,
		borderWidth: 1,
		borderColor: colors.borderLight,
		...elevation(1),
	},
	coverArea: { height: 100, position: 'relative' },
	coverImage: { width: '100%', height: '100%' },
	coverPlaceholder: {
		flex: 1,
		backgroundColor: colors.muted + '50',
		justifyContent: 'center',
		alignItems: 'center',
	},
	statusDot: {
		position: 'absolute',
		left: 8,
		top: 8,
		width: 8,
		height: 8,
		borderRadius: 4,
		borderWidth: 1.5,
		borderColor: colors.overlayWhiteMuted,
	},
	cardActions: {
		position: 'absolute',
		right: 6,
		top: 6,
		flexDirection: 'row',
		gap: 4,
	},
	cardBody: { padding: spacing.sm, gap: 3 },
	cardTitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		lineHeight: 18,
	},
	cardSlug: {
		fontSize: 11,
		color: colors.mutedForeground,
		fontFamily: 'monospace',
	},
	cardPreview: {
		fontFamily: fontFamily.base,
		fontSize: 11,
		color: colors.mutedForeground,
		lineHeight: 15,
		marginTop: 2,
	},
	cardFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		marginTop: spacing.xs,
	},
	cardDate: {
		fontFamily: fontFamily.base,
		fontSize: 10,
		color: colors.mutedForeground,
	},
})
