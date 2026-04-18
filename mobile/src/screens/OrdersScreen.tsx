import { useState } from 'react'
import {
	View,
	Text,
	FlatList,
	Pressable,
	StyleSheet,
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
	getStatusPresentation,
} from '../theme'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import {
	ShoppingCart,
	Clock,
	User,
	CreditCard,
	ChevronRight,
	Package,
} from 'lucide-react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { OrdersStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrdersList'>

const TABS: { key: string; label: string }[] = [
	{ key: 'ALL', label: 'Все' },
	{ key: 'PENDING', label: 'Ожидает' },
	{ key: 'PAID', label: 'Оплачен' },
	{ key: 'SHIPPED', label: 'Отправлен' },
	{ key: 'DELIVERED', label: 'Доставлен' },
	{ key: 'CANCELLED', label: 'Отменён' },
]

export function OrdersScreen({ navigation }: Props) {
	const [tab, setTab] = useState('ALL')
	const [search, setSearch] = useState('')
	const { data, refetch, isRefetching } = trpc.orders.getAllOrders.useQuery({
		page: 1,
		limit: 100,
	})

	const allOrders = data?.items ?? []

	const orders = allOrders.filter((o: any) => {
		if (tab !== 'ALL' && o.status !== tab) return false
		if (search) {
			const q = search.toLowerCase()
			const id = o.id?.toLowerCase() ?? ''
			const name = (o.user?.name || o.user?.email || '').toLowerCase()
			return id.includes(q) || name.includes(q)
		}
		return true
	})

	const renderOrder = ({ item }: { item: any }) => {
		const st = getStatusPresentation(item.status ?? 'PENDING')
		const StatusIcon = st.Icon
		const date = new Date(item.createdAt).toLocaleString('ru-RU', {
			day: '2-digit',
			month: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
		const itemCount = item.items?.length ?? 0
		const customerName = item.user?.name ?? item.user?.email ?? 'Аноним'

		return (
			<View style={styles.miniCardWrapper}>
				<Pressable
					onPress={() => navigation.navigate('OrderDetail', { order: item })}
					android_ripple={ripple.ghost}
					style={({ pressed }) => [
						styles.miniCard,
						elevation(1),
						pressed && Platform.OS === 'ios' ? { opacity: 0.85 } : undefined,
					]}
				>
					{/* Color bar */}
					<View style={[styles.miniCardBar, { backgroundColor: st.bg }]} />

					<View style={styles.miniCardBody}>
						{/* ID + icon status */}
						<View style={styles.miniCardRow}>
							<Text style={styles.miniCardId}>#{item.id.slice(-6)}</Text>
							<View
								style={[styles.statusIconCircle, { backgroundColor: st.bg }]}
							>
								<StatusIcon size={12} color={st.color} />
							</View>
						</View>

						{/* Total */}
						<Text style={styles.miniCardTotal}>
							{item.total?.toLocaleString('ru-RU')} ₽
						</Text>

						{/* Customer */}
						<View style={styles.miniCardRow}>
							<User
								size={12}
								color={colors.mutedForeground}
								style={{ marginRight: 4 }}
							/>
							<Text style={styles.miniCardCustomer} numberOfLines={1}>
								{customerName}
							</Text>
						</View>

						{/* Date + item count */}
						<View style={[styles.miniCardRow, { marginTop: 'auto' as any }]}>
							<View style={styles.miniCardMeta}>
								<Clock
									size={12}
									color={colors.mutedForeground}
									style={{ marginRight: 2 }}
								/>
								<Text style={styles.miniCardMetaText}>{date}</Text>
							</View>
							<View style={styles.miniCardMeta}>
								<Package
									size={12}
									color={colors.mutedForeground}
									style={{ marginRight: 2 }}
								/>
								<Text style={styles.miniCardMetaText}>{itemCount}</Text>
							</View>
						</View>

						{/* CTA */}
						<View style={styles.miniCardBtn}>
							<View
								style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
							>
								<Text style={styles.miniCardBtnText}>Подробнее</Text>
								<ChevronRight size={12} color={colors.primary} />
							</View>
						</View>
					</View>
				</Pressable>
			</View>
		)
	}

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='Заказы'
				icon={
					<View style={styles.headerIcon}>
						<ShoppingCart size={20} color={colors.primaryForeground} />
					</View>
				}
			/>
			<View style={styles.searchRow}>
				<SearchInput
					value={search}
					onChangeText={setSearch}
					placeholder='Поиск по ID или клиенту...'
				/>
			</View>
			<View style={styles.tabsRow}>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={TABS}
					keyExtractor={t => t.key}
					contentContainerStyle={styles.tabsContent}
					renderItem={({ item: t }) => {
						const active = t.key === tab
						const count =
							t.key === 'ALL'
								? allOrders.length
								: allOrders.filter((o: any) => o.status === t.key).length
						return (
							<Pressable
								android_ripple={active ? ripple.primary : ripple.ghost}
								style={[
									styles.tab,
									active && styles.tabActive,
									Platform.OS === 'android'
										? { overflow: 'hidden' }
										: undefined,
								]}
								onPress={() => setTab(t.key)}
							>
								<Text style={[styles.tabText, active && styles.tabTextActive]}>
									{t.label}
								</Text>
								<View
									style={[styles.tabBadge, active && styles.tabBadgeActive]}
								>
									<Text
										style={[
											styles.tabBadgeText,
											active && styles.tabBadgeTextActive,
										]}
									>
										{count}
									</Text>
								</View>
							</Pressable>
						)
					}}
				/>
			</View>
			<FlatList
				data={orders}
				keyExtractor={(item: any) => item.id}
				numColumns={2}
				columnWrapperStyle={styles.gridRow}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary}
					/>
				}
				contentContainerStyle={styles.list}
				renderItem={renderOrder}
				ListEmptyComponent={
					<EmptyState
						icon={
							<ShoppingCart size={36} color={colors.mutedForeground + '40'} />
						}
						title='Заказов нет'
						description={
							search ? 'Попробуйте другой запрос' : 'Заказы появятся здесь'
						}
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
	searchRow: { paddingHorizontal: spacing.xs, paddingBottom: spacing.sm },
	tabsRow: { paddingBottom: spacing.sm },
	tabsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
	tab: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.md,
		backgroundColor: colors.card,
		borderWidth: 1,
		borderColor: colors.borderLight,
	},
	tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	tabText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
	},
	tabTextActive: {
		color: colors.primaryForeground,
		fontWeight: fontWeight.semibold,
	},
	tabBadge: {
		minWidth: 20,
		height: 20,
		borderRadius: 10,
		backgroundColor: colors.muted,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 6,
	},
	tabBadgeActive: { backgroundColor: colors.overlayWhiteLight },
	tabBadgeText: {
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
	},
	tabBadgeTextActive: { color: colors.primaryForeground },
	list: { padding: spacing.lg, paddingTop: spacing.xs },
	gridRow: { gap: spacing.sm, marginBottom: spacing.sm },

	// Mini card (same as Dashboard)
	miniCardWrapper: { flex: 1 },
	miniCard: {
		borderRadius: borderRadius.md,
		backgroundColor: colors.card,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: colors.borderLight,
		...elevation(1),
	},
	miniCardBar: { height: 3 },
	miniCardBody: { padding: spacing.md, gap: spacing.sm },
	miniCardRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	miniCardId: {
		fontFamily: 'monospace',
		fontSize: 10,
		color: colors.mutedForeground,
	},
	statusIconCircle: {
		width: 24,
		height: 24,
		borderRadius: borderRadius.sm,
		justifyContent: 'center',
		alignItems: 'center',
	},

	miniCardTotal: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xl,
		fontWeight: fontWeight.bold,
		color: colors.foreground,
	},
	miniCardCustomer: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
		flex: 1,
	},
	miniCardMeta: { flexDirection: 'row', alignItems: 'center' },
	miniCardMetaText: {
		fontFamily: fontFamily.base,
		fontSize: 10,
		color: colors.mutedForeground,
	},
	miniCardBtn: {
		backgroundColor: colors.primary + '14',
		borderRadius: borderRadius.sm,
		paddingVertical: 6,
		alignItems: 'center',
		marginTop: spacing.xs,
	},
	miniCardBtnText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		color: colors.primary,
	},
})
