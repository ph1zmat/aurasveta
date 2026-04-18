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
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { IconButton } from '../components/ui/IconButton'
import { useToast } from '../components/ui/Toast'
import { Webhook, Globe, Play, Trash2, Plus } from 'lucide-react-native'

const EVENTS = [
	'order.created',
	'order.updated',
	'product.created',
	'product.updated',
	'product.deleted',
]

export function WebhooksScreen() {
	const {
		data: webhooks,
		refetch,
		isRefetching,
	} = trpc.webhooks.getAll.useQuery()
	const utils = trpc.useUtils()
	const { showToast } = useToast()
	const createMut = trpc.webhooks.create.useMutation({
		onSuccess: () => {
			utils.webhooks.getAll.invalidate()
			setModalVisible(false)
			showToast('Webhook создан', 'success')
		},
	})
	const deleteMut = trpc.webhooks.delete.useMutation({
		onSuccess: () => {
			utils.webhooks.getAll.invalidate()
			showToast('Webhook удалён', 'success')
		},
	})
	const testMut = trpc.webhooks.test.useMutation({
		onSuccess: () => showToast('Webhook отправлен', 'success'),
	})

	const [modalVisible, setModalVisible] = useState(false)
	const [url, setUrl] = useState('')
	const [selectedEvents, setSelectedEvents] = useState<string[]>([])

	const toggleEvent = (ev: string) =>
		setSelectedEvents(prev =>
			prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev],
		)

	const handleCreate = () => {
		if (!url.trim() || selectedEvents.length === 0) return
		createMut.mutate({ url: url.trim(), events: selectedEvents })
	}

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='Webhooks'
				showBack
				icon={
					<View style={styles.headerIcon}>
						<Webhook size={20} color={colors.primaryForeground} />
					</View>
				}
				right={
					<Button
						title='Создать'
						size='sm'
						onPress={() => {
							setUrl('')
							setSelectedEvents([])
							setModalVisible(true)
						}}
						icon={<Plus size={14} color={colors.primaryForeground} />}
					/>
				}
			/>
			<FlatList
				data={webhooks ?? []}
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
					<View style={[styles.whCard, elevation(1)]}>
						<View style={styles.whHeader}>
							<Globe size={14} color={colors.mutedForeground} />
							<Text style={styles.whUrl} numberOfLines={1}>
								{item.url}
							</Text>
						</View>
						<View style={styles.eventsRow}>
							{(item.events ?? []).map((ev: string) => (
								<Badge
									key={ev}
									label={ev}
									color={colors.primary}
									bg={colors.primary + '1A'}
								/>
							))}
						</View>
						<View style={styles.whActions}>
							<Pressable
								android_ripple={ripple.ghost}
								style={[
									styles.testBtn,
									Platform.OS === 'android'
										? { overflow: 'hidden' }
										: undefined,
								]}
								onPress={() => testMut.mutate(item.id)}
							>
								<Play size={14} color={colors.statusPaid} />
								<Text style={styles.testText}>Тест</Text>
							</Pressable>
							<IconButton
								icon={<Trash2 size={16} color={colors.destructive} />}
								onPress={() =>
									Alert.alert('Удалить?', item.url, [
										{ text: 'Отмена' },
										{
											text: 'Удалить',
											style: 'destructive',
											onPress: () => deleteMut.mutate(item.id),
										},
									])
								}
								accessibilityLabel='Удалить'
								size='md'
								variant='surface'
							/>
						</View>
					</View>
				)}
				ListEmptyComponent={
					<EmptyState
						icon={<Webhook size={36} color={colors.mutedForeground + '40'} />}
						title='Нет webhook-ов'
						description='Создайте первый webhook'
					/>
				}
			/>
			<Modal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				title='Новый Webhook'
			>
				<Input
					label='URL'
					value={url}
					onChangeText={setUrl}
					placeholder='https://example.com/hook'
					containerStyle={{ marginBottom: spacing.md }}
				/>
				<Text style={styles.evLabel}>События</Text>
				<View style={styles.evChips}>
					{EVENTS.map(ev => {
						const active = selectedEvents.includes(ev)
						return (
							<Pressable
								key={ev}
								android_ripple={ripple.ghost}
								style={[
									styles.evChip,
									active && styles.evChipActive,
									Platform.OS === 'android'
										? { overflow: 'hidden' }
										: undefined,
								]}
								onPress={() => toggleEvent(ev)}
							>
								<Text
									style={[styles.evChipText, active && styles.evChipTextActive]}
								>
									{ev}
								</Text>
							</Pressable>
						)
					})}
				</View>
				<View style={styles.modalActions}>
					<Button
						title='Отмена'
						variant='outline'
						onPress={() => setModalVisible(false)}
					/>
					<Button
						title='Создать'
						onPress={handleCreate}
						loading={createMut.isPending}
					/>
				</View>
			</Modal>
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
	list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
	whCard: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		padding: spacing.md,
		marginBottom: spacing.md,
		borderWidth: 1,
		borderColor: colors.borderLight,
		...elevation(1),
	},
	whHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	whUrl: {
		fontSize: fontSize.sm,
		color: colors.foreground,
		fontFamily: 'monospace',
		flex: 1,
	},
	eventsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: spacing.xs,
		marginBottom: spacing.sm,
	},
	whActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: spacing.sm,
	},
	testBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.sm,
		backgroundColor: colors.statusPaid + '1A',
	},
	testText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		color: colors.statusPaid,
	},
	evLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
		marginBottom: spacing.sm,
	},
	evChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
	evChip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.full,
		backgroundColor: colors.primary + '0D',
	},
	evChipActive: {
		backgroundColor: colors.primary + '20',
		borderColor: colors.primary,
	},
	evChipText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
	},
	evChipTextActive: { color: colors.primary, fontWeight: fontWeight.medium },
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: spacing.sm,
		marginTop: spacing.lg,
	},
})
