import {
	View,
	Text,
	FlatList,
	Pressable,
	StyleSheet,
	RefreshControl,
	Dimensions,
	Platform,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
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
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { AsyncImage } from '../components/ui/AsyncImage'
import { EmptyState } from '../components/ui/EmptyState'
import {
	FolderOpen,
	Package,
	ArrowRight,
	FolderTree,
} from 'lucide-react-native'
import type { CategoriesStackParamList } from '../navigation/types'
import { resolveImageUrl } from '../lib/resolveImageUrl'

const CARD_GAP = spacing.md
const SCREEN_PAD = spacing.lg
const cardWidth =
	(Dimensions.get('window').width - SCREEN_PAD * 2 - CARD_GAP) / 2

export function CategoriesScreen() {
	const navigation =
		useNavigation<NativeStackNavigationProp<CategoriesStackParamList>>()
	const {
		data: tree,
		refetch,
		isRefetching,
	} = trpc.categories.getTree.useQuery()
	const apiUrl = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'

	const renderCategory = ({ item }: { item: any }) => {
		const imageUrl = resolveImageUrl(
			item.imageUrl ?? item.imagePath ?? item.image,
			apiUrl,
		)
		const productCount = item._count?.products ?? 0
		const childrenCount = item.children?.length ?? 0

		return (
			<View style={styles.cardWrapper}>
				<Pressable
					android_ripple={ripple.ghost}
					onPress={() =>
						navigation.navigate('CategoryDetail', { category: item })
					}
					style={({ pressed }) => [
						styles.card,
						elevation(1),
						pressed && Platform.OS === 'ios' ? { opacity: 0.85 } : undefined,
						Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
					]}
				>
					{/* Image */}
					<View style={styles.imageBox}>
						{imageUrl ? (
							<AsyncImage
								uri={imageUrl}
								containerStyle={styles.catImage}
								imageStyle={styles.catImage}
								resizeMode='cover'
							/>
						) : (
							<FolderTree size={28} color={colors.mutedForeground + '30'} />
						)}
					</View>

					{/* Info */}
					<View style={styles.cardBody}>
						<Text style={styles.catName} numberOfLines={2}>
							{item.name}
						</Text>

						<View style={styles.counters}>
							{productCount > 0 && (
								<View style={styles.counter}>
									<Package size={11} color={colors.mutedForeground} />
									<Text style={styles.counterText}>{productCount}</Text>
								</View>
							)}
							{childrenCount > 0 && (
								<View style={styles.counter}>
									<FolderTree size={11} color={colors.mutedForeground} />
									<Text style={styles.counterText}>{childrenCount}</Text>
								</View>
							)}
						</View>

						<View style={styles.openBtn}>
							<Text style={styles.openBtnText}>Открыть</Text>
							<ArrowRight size={12} color={colors.primary} />
						</View>
					</View>
				</Pressable>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='Категории'
				icon={
					<View style={styles.headerIcon}>
						<FolderOpen size={20} color={colors.primaryForeground} />
					</View>
				}
			/>
			<FlatList
				data={tree ?? []}
				numColumns={2}
				keyExtractor={(item: any) => item.id}
				columnWrapperStyle={styles.gridRow}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary}
					/>
				}
				contentContainerStyle={styles.list}
				renderItem={renderCategory}
				ListEmptyComponent={
					<EmptyState
						icon={
							<FolderOpen size={36} color={colors.mutedForeground + '40'} />
						}
						title='Нет категорий'
						description='Категории пока не созданы'
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
		paddingHorizontal: SCREEN_PAD,
		paddingTop: spacing.sm,
		paddingBottom: spacing.xl,
	},
	gridRow: {
		gap: CARD_GAP,
		marginBottom: CARD_GAP,
	},
	cardWrapper: {
		width: cardWidth,
	},
	card: {
		borderRadius: borderRadius.md,
		backgroundColor: colors.card,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: colors.borderLight,
	},
	imageBox: {
		width: '100%',
		aspectRatio: 4 / 3,
		backgroundColor: colors.muted + '40',
		justifyContent: 'center',
		alignItems: 'center',
	},
	catImage: {
		width: '100%',
		height: '100%',
	},
	cardBody: {
		padding: spacing.sm,
		gap: spacing.xs,
	},
	catName: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		lineHeight: fontSize.sm * 1.3,
	},
	counters: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
	},
	counter: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	counterText: {
		fontFamily: fontFamily.base,
		fontSize: 11,
		color: colors.mutedForeground,
	},
	openBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: spacing.xs,
		backgroundColor: colors.primary + '15',
		borderRadius: borderRadius.md,
		paddingVertical: 6,
		marginTop: spacing.xs,
	},
	openBtnText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		color: colors.primary,
	},
})
