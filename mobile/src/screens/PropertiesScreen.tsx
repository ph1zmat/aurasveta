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
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { IconButton } from '../components/ui/IconButton'
import { useToast } from '../components/ui/Toast'
import { SlidersHorizontal, Pencil, Trash2, Plus } from 'lucide-react-native'

const TYPE_COLORS: Record<string, string> = {
	STRING: colors.typeString,
	NUMBER: colors.typeNumber,
	BOOLEAN: colors.typeBoolean,
	DATE: colors.typeDate,
	SELECT: colors.typeSelect,
}

export function PropertiesScreen() {
	const {
		data: properties,
		refetch,
		isRefetching,
	} = trpc.properties.getAll.useQuery()
	const utils = trpc.useUtils()
	const { showToast } = useToast()
	const createMut = trpc.properties.create.useMutation({
		onSuccess: () => {
			utils.properties.getAll.invalidate()
			setModalVisible(false)
			showToast('Свойство создано', 'success')
		},
	})
	const updateMut = trpc.properties.update.useMutation({
		onSuccess: () => {
			utils.properties.getAll.invalidate()
			setModalVisible(false)
			showToast('Свойство обновлено', 'success')
		},
	})
	const deleteMut = trpc.properties.delete.useMutation({
		onSuccess: () => {
			utils.properties.getAll.invalidate()
			showToast('Свойство удалено', 'success')
		},
	})

	const [modalVisible, setModalVisible] = useState(false)
	const [editId, setEditId] = useState<string | null>(null)
	const [formName, setFormName] = useState('')
	const [formType, setFormType] = useState('STRING')

	const openCreate = () => {
		setEditId(null)
		setFormName('')
		setFormType('STRING')
		setModalVisible(true)
	}
	const openEdit = (item: any) => {
		setEditId(item.id)
		setFormName(item.name)
		setFormType(item.type)
		setModalVisible(true)
	}
	const handleSave = () => {
		if (!formName.trim()) return
		if (editId)
			updateMut.mutate({ id: editId, name: formName.trim(), type: formType })
		else createMut.mutate({ name: formName.trim(), type: formType })
	}

	return (
		<View style={styles.container}>
			<ScreenHeader
				title='Свойства'
				showBack
				icon={
					<View style={styles.headerIcon}>
						<SlidersHorizontal size={20} color={colors.primaryForeground} />
					</View>
				}
				right={
					<Button
						title='Создать'
						size='sm'
						onPress={openCreate}
						icon={<Plus size={14} color={colors.primaryForeground} />}
					/>
				}
			/>
			<FlatList
				data={properties ?? []}
				keyExtractor={(item: any) => item.id}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary}
					/>
				}
				contentContainerStyle={styles.list}
				renderItem={({ item }: { item: any }) => {
					const typeColor = TYPE_COLORS[item.type] ?? colors.mutedForeground
					return (
						<View style={styles.propCard}>
							<View style={styles.propInfo}>
								<Text style={styles.propName}>{item.name}</Text>
								<Badge
									label={item.type}
									color={typeColor}
									bg={typeColor + '1A'}
									style={{ alignSelf: 'flex-start', marginTop: 4 }}
								/>
							</View>
							<View style={styles.propActions}>
								<IconButton
									icon={<Pencil size={16} color={colors.primary} />}
									onPress={() => openEdit(item)}
									accessibilityLabel='Редактировать'
									size='md'
									variant='surface'
								/>
								<IconButton
									icon={<Trash2 size={16} color={colors.destructive} />}
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
									size='md'
									variant='surface'
								/>
							</View>
						</View>
					)
				}}
				ListEmptyComponent={
					<EmptyState
						icon={
							<SlidersHorizontal
								size={36}
								color={colors.mutedForeground + '40'}
							/>
						}
						title='Нет свойств'
						description='Создайте первое свойство'
					/>
				}
			/>
			<Modal
				visible={modalVisible}
				onClose={() => setModalVisible(false)}
				title={editId ? 'Редактировать' : 'Новое свойство'}
			>
				<Input
					label='Название'
					value={formName}
					onChangeText={setFormName}
					placeholder='Например: Цвет'
					containerStyle={{ marginBottom: spacing.md }}
				/>
				<Text style={styles.typeLabel}>Тип</Text>
				<View style={styles.typeRow}>
					{['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'].map(t => {
						const active = formType === t
						const tc = TYPE_COLORS[t] ?? colors.mutedForeground
						return (
							<Pressable
								key={t}
								android_ripple={ripple.ghost}
								style={[
									styles.typeChip,
									active && { backgroundColor: tc + '20', borderColor: tc },
									Platform.OS === 'android'
										? { overflow: 'hidden' }
										: undefined,
								]}
								onPress={() => setFormType(t)}
							>
								<Text style={[styles.typeChipText, active && { color: tc }]}>
									{t}
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
						title={editId ? 'Сохранить' : 'Создать'}
						onPress={handleSave}
						loading={createMut.isPending || updateMut.isPending}
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
	propCard: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: spacing.md,
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.sm,
	},
	propInfo: { flex: 1 },
	propName: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
	},
	propActions: { flexDirection: 'row', gap: spacing.sm },
	typeLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
		marginBottom: spacing.sm,
	},
	typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
	typeChip: {
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.md,
		borderWidth: 1,
		borderColor: colors.border,
		backgroundColor: colors.card,
	},
	typeChipText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
	},
	modalActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: spacing.sm,
		marginTop: spacing.lg,
	},
})
