import { View, Text, ScrollView, Image, StyleSheet, Alert } from 'react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
	elevation,
} from '../theme'
import { Button } from '../components/ui/Button'
import { StatusBadge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { trpc } from '../lib/trpc'
import { useToast } from '../components/ui/Toast'
import {
	User,
	Phone,
	MapPin,
	MessageSquare,
	Package,
	Hash,
	Calendar,
} from 'lucide-react-native'
import type { OrderDetailProps } from '../navigation/types'
import type { StatusKey } from '../theme'
import type { OrderStatus } from '../navigation/types'

const STATUS_TRANSITIONS: Record<string, string[]> = {
	PENDING: ['PAID', 'CANCELLED'],
	PAID: ['SHIPPED', 'CANCELLED'],
	SHIPPED: ['DELIVERED'],
	DELIVERED: [],
	CANCELLED: [],
}

const STATUS_LABELS: Record<string, string> = {
	PENDING: 'Ожидает',
	PAID: 'Оплачен',
	SHIPPED: 'Отправлен',
	DELIVERED: 'Доставлен',
	CANCELLED: 'Отменён',
}

export function OrderDetailScreen({ route, navigation }: OrderDetailProps) {
	const order = route.params.order
	const utils = trpc.useUtils()
	const { showToast } = useToast()
	const updateStatus = trpc.orders.updateStatus.useMutation({
		onSuccess: () => {
			utils.orders.getAllOrders.invalidate()
			showToast('Статус обновлён', 'success')
			navigation.goBack()
		},
	})

	const handleStatusChange = (status: string) => {
		const label = STATUS_LABELS[status]
		Alert.alert('Изменить статус', `Установить статус "${label}"?`, [
			{ text: 'Отмена' },
			{
				text: 'Да',
				onPress: () =>
					updateStatus.mutate({ id: order.id, status: status as OrderStatus }),
			},
		])
	}

	const transitions = STATUS_TRANSITIONS[order.status] || []
	const items = order.items ?? []

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			{/* Status header */}
			<Card style={styles.statusCard}>
				<View style={styles.statusRow}>
					<StatusBadge status={order.status} />
					<Text style={styles.orderId}>#{order.id.slice(-6)}</Text>
				</View>
				<Text style={styles.date}>
					{new Date(order.createdAt).toLocaleDateString('ru-RU', {
						day: 'numeric',
						month: 'long',
						year: 'numeric',
						hour: '2-digit',
						minute: '2-digit',
					})}
				</Text>
			</Card>

			{/* Customer info */}
			<Card style={styles.card}>
				<Text style={styles.sectionTitle}>Клиент</Text>
				<InfoRow
					label='Имя'
					value={order.user?.name || order.user?.email || '—'}
				/>
				{order.user?.email ? (
					<InfoRow label='Email' value={order.user.email} />
				) : null}
				{order.phone ? <InfoRow label='Телефон' value={order.phone} /> : null}
				{order.address ? <InfoRow label='Адрес' value={order.address} /> : null}
				{order.comment ? (
					<InfoRow label='Комментарий' value={order.comment} />
				) : null}
			</Card>

			{/* Order items */}
			<Card style={styles.card}>
				<Text style={styles.sectionTitle}>Товары ({items.length})</Text>
				{items.map((item: any, i: number) => (
					<View
						key={item.id ?? i}
						style={[styles.itemRow, i < items.length - 1 && styles.itemBorder]}
					>
						{item.product?.images?.[0] ? (
							<Image
								source={{
									uri: item.product.images[0].startsWith('http')
										? item.product.images[0]
										: `https://aurasveta.ru${item.product.images[0]}`,
								}}
								style={styles.itemImage}
							/>
						) : (
							<View style={[styles.itemImage, styles.itemImagePlaceholder]}>
								<Package size={20} color={colors.mutedForeground} />
							</View>
						)}
						<View style={styles.itemInfo}>
							<Text style={styles.itemName} numberOfLines={2}>
								{item.product?.name ?? 'Товар'}
							</Text>
							<Text style={styles.itemQty}>
								{item.quantity} × {item.price?.toLocaleString('ru-RU')} ₽
							</Text>
						</View>
						<Text style={styles.itemTotal}>
							{((item.quantity ?? 1) * (item.price ?? 0)).toLocaleString(
								'ru-RU',
							)}{' '}
							₽
						</Text>
					</View>
				))}
				<View style={styles.totalRow}>
					<Text style={styles.totalLabel}>Итого</Text>
					<Text style={styles.totalValue}>
						{order.total?.toLocaleString('ru-RU')} ₽
					</Text>
				</View>
			</Card>

			{/* Status actions */}
			{transitions.length > 0 && (
				<Card style={styles.card}>
					<Text style={styles.sectionTitle}>Действия</Text>
					<View style={styles.actionsRow}>
						{transitions.map((s: string) => (
							<Button
								key={s}
								title={STATUS_LABELS[s]}
								variant={s === 'CANCELLED' ? 'destructive' : 'primary'}
								size='md'
								onPress={() => handleStatusChange(s)}
								loading={updateStatus.isPending}
								style={{ flex: 1, marginHorizontal: spacing.xs }}
							/>
						))}
					</View>
				</Card>
			)}

			<View style={{ height: spacing['2xl'] }} />
		</ScrollView>
	)
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<View style={styles.infoRow}>
			<Text style={styles.infoLabel}>{label}</Text>
			<Text style={styles.infoValue}>{value}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.lg },
	statusCard: { marginBottom: spacing.md, alignItems: 'center' },
	statusRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		marginBottom: spacing.sm,
	},
	orderId: {
		fontSize: fontSize.sm,
		fontFamily: 'monospace',
		color: colors.mutedForeground,
	},
	date: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
	},
	card: { marginBottom: spacing.md },
	sectionTitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		marginBottom: spacing.md,
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.separator,
	},
	infoLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
	},
	infoValue: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
		flex: 1,
		textAlign: 'right',
	},
	itemRow: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: spacing.sm,
	},
	itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.separator },
	itemImage: {
		width: 48,
		height: 48,
		borderRadius: borderRadius.sm,
		marginRight: spacing.md,
	},
	itemImagePlaceholder: {
		backgroundColor: colors.muted,
		justifyContent: 'center',
		alignItems: 'center',
	},
	itemInfo: { flex: 1 },
	itemName: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
	},
	itemQty: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
		marginTop: 2,
	},
	itemTotal: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		paddingTop: spacing.md,
		marginTop: spacing.sm,
		borderTopWidth: 1,
		borderTopColor: colors.border,
	},
	totalLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.lg,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
	},
	totalValue: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.lg,
		fontWeight: fontWeight.bold,
		color: colors.primary,
	},
	actionsRow: { flexDirection: 'row' },
})
