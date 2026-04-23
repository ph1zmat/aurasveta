import { useState } from 'react'
import {
	View,
	Text,
	FlatList,
	Pressable,
	StyleSheet,
	Alert,
	RefreshControl,
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
import { SearchInput } from '../components/ui/SearchInput'
import { AsyncImage } from '../components/ui/AsyncImage'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { useToast } from '../components/ui/Toast'
import {
	Package,
	Pencil,
	Trash2,
	ImagePlus,
	ChevronLeft,
	ChevronRight,
} from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ProductsStackParamList } from '../navigation/types'
import { resolveImageUrl } from '../lib/resolveImageUrl'

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductsList'>

function resolveProductImage(
	image:
		| {
				key?: string | null
				url?: string | null
				displayUrl?: string | null
				imageAsset?: { url?: string | null } | null
		  }
		| null
		| undefined,
	apiUrl: string,
) {
	const value =
		image?.displayUrl ?? image?.imageAsset?.url ?? image?.url ?? image?.key ?? null
	return resolveImageUrl(value, apiUrl)
}

export function ProductsScreen({ navigation }: Props) {
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const { data, refetch, isRefetching } = trpc.products.getMany.useQuery({
		page,
		limit: 20,
		search: search || undefined,
	})
	const utils = trpc.useUtils()
	const { showToast } = useToast()
	const deleteMut = trpc.products.delete.useMutation({
		onSuccess: () => {
			utils.products.getMany.invalidate()
			showToast('Товар удалён', 'success')
		},
		onError: (err: any) => showToast(err.message || 'Ошибка удаления', 'error'),
	})

	const apiUrl = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'

	const renderItem = ({ item, index }: { item: any; index: number }) => {
		const imageUrl = resolveProductImage(item.images?.[0], apiUrl)
		const isLeft = index % 2 === 0

		return (
			<View
				style={[
					styles.gridItem,
					isLeft ? { paddingRight: spacing.xs } : { paddingLeft: spacing.xs },
				]}
			>
				<Pressable
					android_ripple={ripple.ghost}
					onPress={() => navigation.navigate('ProductForm', { id: item.id })}
					style={({ pressed }) => [
						styles.productCard,
						elevation(1),
						pressed && Platform.OS === 'ios' ? { opacity: 0.85 } : undefined,
					]}
				>
					<View
						style={[
							styles.statusDot,
							{
								backgroundColor: item.isActive
									? colors.statusPaid
									: colors.statusCancelled,
							},
						]}
					/>
					<View style={styles.cardActions}>
						<IconButton
							icon={<Pencil size={16} color={colors.primaryForeground} />}
							onPress={() =>
								navigation.navigate('ProductForm', { id: item.id })
							}
							accessibilityLabel='Редактировать'
							size='sm'
							variant='overlay'
						/>
						<IconButton
							icon={<Trash2 size={16} color={colors.primaryForeground} />}
							onPress={() =>
								Alert.alert('Удалить?', `"${item.name}"`, [
									{ text: 'Отмена' },
									{
										text: 'Удалить',
										style: 'destructive',
										onPress: () => deleteMut.mutate(item.id),
									},
								])
							}
							accessibilityLabel='Удалить'
							size='sm'
							variant='overlay'
						/>
					</View>
					<View style={styles.imageContainer}>
						{imageUrl ? (
							<AsyncImage
								uri={imageUrl}
								containerStyle={styles.productImage}
								imageStyle={styles.productImage}
								resizeMode='cover'
							/>
						) : (
							<View style={[styles.productImage, styles.imagePlaceholder]}>
								<ImagePlus size={28} color={colors.mutedForeground + '50'} />
							</View>
						)}
					</View>
					<View style={styles.productInfo}>
						<Text style={styles.productName} numberOfLines={2}>
							{item.name}
						</Text>
						<View style={styles.priceRow}>
							<Text style={styles.productPrice}>
								{item.price?.toLocaleString('ru-RU')} ₽
							</Text>
							{item.compareAtPrice != null && item.compareAtPrice > 0 && (
								<Text style={styles.oldPrice}>
									{item.compareAtPrice.toLocaleString('ru-RU')} ₽
								</Text>
							)}
						</View>
					</View>
				</Pressable>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='Товары'
				icon={
					<View style={styles.headerIcon}>
						<Package size={20} color={colors.primaryForeground} />
					</View>
				}
				right={
					<Button
						title='Добавить'
						size='sm'
						onPress={() => navigation.navigate('ProductForm')}
					/>
				}
			/>
			<View style={styles.searchRow}>
				<SearchInput
					value={search}
					onChangeText={v => {
						setSearch(v)
						setPage(1)
					}}
					placeholder='Поиск по названию...'
				/>
			</View>
			<FlatList
				data={data?.items ?? []}
				keyExtractor={(item: any) => item.id}
				numColumns={2}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary}
					/>
				}
				contentContainerStyle={styles.list}
				renderItem={renderItem}
				ListEmptyComponent={
					<EmptyState
						icon={<Package size={36} color={colors.mutedForeground + '40'} />}
						title='Товары не найдены'
						description={
							search ? 'Попробуйте другой запрос' : 'Добавьте первый товар'
						}
					/>
				}
				ListFooterComponent={
					data && data.totalPages > 1 ? (
						<View style={styles.pagination}>
							<Pressable
								onPress={() => setPage(p => Math.max(1, p - 1))}
								disabled={page === 1}
								android_ripple={ripple.icon}
								style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}
							>
								<ChevronLeft
									size={16}
									color={
										page === 1 ? colors.mutedForeground : colors.foreground
									}
								/>
							</Pressable>
							<Text style={styles.pageInfo}>
								{page} / {data.totalPages}
							</Text>
							<Pressable
								onPress={() => setPage(p => Math.min(data.totalPages, p + 1))}
								disabled={page === data.totalPages}
								android_ripple={ripple.icon}
								style={[
									styles.pageBtn,
									page === data.totalPages && styles.pageBtnDisabled,
								]}
							>
								<ChevronRight
									size={16}
									color={
										page === data.totalPages
											? colors.mutedForeground
											: colors.foreground
									}
								/>
							</Pressable>
						</View>
					) : null
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
	searchRow: { paddingHorizontal: spacing.xs, paddingBottom: spacing.sm },
	list: { paddingHorizontal: spacing.lg - spacing.xs, paddingTop: spacing.sm },
	gridItem: { width: '50%' as any, paddingBottom: spacing.md },
	productCard: {
		borderRadius: borderRadius.md,
		backgroundColor: colors.card,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: colors.borderLight,
	},
	statusDot: {
		position: 'absolute',
		top: spacing.sm,
		left: spacing.sm,
		width: 10,
		height: 10,
		borderRadius: 5,
		zIndex: 2,
		borderWidth: 1.5,
		borderColor: colors.overlayWhite,
	},
	cardActions: {
		position: 'absolute',
		top: spacing.sm,
		right: spacing.sm,
		flexDirection: 'row',
		gap: 4,
		zIndex: 2,
	},
	imageContainer: { width: '100%', aspectRatio: 1 },
	productImage: { width: '100%', height: '100%' },
	imagePlaceholder: {
		backgroundColor: colors.muted,
		justifyContent: 'center',
		alignItems: 'center',
	},
	productInfo: { padding: spacing.md },
	productName: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
		marginBottom: 6,
		lineHeight: 18,
	},
	priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
	productPrice: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		fontWeight: fontWeight.bold,
		color: colors.primary,
	},
	oldPrice: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
		textDecorationLine: 'line-through',
	},
	pagination: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		paddingVertical: spacing.lg,
		gap: spacing.lg,
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
	pageBtnDisabled: { opacity: 0.4 },
	pageInfo: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.mutedForeground,
	},
})
