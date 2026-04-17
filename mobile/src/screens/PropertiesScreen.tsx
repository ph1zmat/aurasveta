import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { SlidersHorizontal, Pencil, Trash2, Plus } from 'lucide-react-native'

const TYPE_COLORS: Record<string, string> = {
  STRING: colors.typeString, NUMBER: colors.typeNumber, BOOLEAN: colors.typeBoolean, DATE: colors.typeDate, SELECT: colors.typeSelect,
}

export function PropertiesScreen() {
  const { data: properties, refetch, isRefetching } = trpc.properties.getAll.useQuery()
  const utils = trpc.useUtils()
  const createMut = trpc.properties.create.useMutation({ onSuccess: () => { utils.properties.getAll.invalidate(); setModalVisible(false) } })
  const updateMut = trpc.properties.update.useMutation({ onSuccess: () => { utils.properties.getAll.invalidate(); setModalVisible(false) } })
  const deleteMut = trpc.properties.delete.useMutation({ onSuccess: () => utils.properties.getAll.invalidate() })

  const [modalVisible, setModalVisible] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState('STRING')

  const openCreate = () => { setEditId(null); setFormName(''); setFormType('STRING'); setModalVisible(true) }
  const openEdit = (item: any) => { setEditId(item.id); setFormName(item.name); setFormType(item.type); setModalVisible(true) }
  const handleSave = () => {
    if (!formName.trim()) return
    if (editId) updateMut.mutate({ id: editId, name: formName.trim(), type: formType })
    else createMut.mutate({ name: formName.trim(), type: formType })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><SlidersHorizontal size={18} color={colors.statusPaid} /></View>
          <Text style={styles.headerTitle}>СВОЙСТВА</Text>
        </View>
        <Button title="Создать" size="sm" onPress={openCreate} icon={<Plus size={14} color={colors.primaryForeground} />} />
      </View>
      <FlatList
        data={properties ?? []} keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: any }) => {
          const typeColor = TYPE_COLORS[item.type] ?? colors.mutedForeground
          return (
            <View style={styles.propCard}>
              <View style={styles.propInfo}>
                <Text style={styles.propName}>{item.name}</Text>
                <Badge label={item.type} color={typeColor} bg={typeColor + '1A'} style={{ alignSelf: 'flex-start', marginTop: 4 }} />
              </View>
              <View style={styles.propActions}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEdit(item)}><Pencil size={16} color={colors.primary} /></TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Удалить?', `"${item.name}"`, [{ text: 'Отмена' }, { text: 'Удалить', style: 'destructive', onPress: () => deleteMut.mutate(item.id) }])}><Trash2 size={16} color={colors.destructive} /></TouchableOpacity>
              </View>
            </View>
          )
        }}
        ListEmptyComponent={<EmptyState icon={<SlidersHorizontal size={36} color={colors.mutedForeground + '40'} />} title="Нет свойств" description="Создайте первое свойство" />}
      />
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title={editId ? 'Редактировать' : 'Новое свойство'}>
        <Input label="Название" value={formName} onChangeText={setFormName} placeholder="Например: Цвет" containerStyle={{ marginBottom: spacing.md }} />
        <Text style={styles.typeLabel}>Тип</Text>
        <View style={styles.typeRow}>
          {['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'SELECT'].map(t => {
            const active = formType === t
            const tc = TYPE_COLORS[t] ?? colors.mutedForeground
            return (
              <TouchableOpacity key={t} style={[styles.typeChip, active && { backgroundColor: tc + '20', borderColor: tc }]} onPress={() => setFormType(t)}>
                <Text style={[styles.typeChipText, active && { color: tc }]}>{t}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <Button title={editId ? 'Сохранить' : 'Создать'} onPress={handleSave} loading={createMut.isPending || updateMut.isPending} style={{ marginTop: spacing.lg }} />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.statusPaid + '1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, letterSpacing: 3, color: colors.foreground },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  propCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  propInfo: { flex: 1 },
  propName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground },
  propActions: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' },
  typeLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  typeChipText: { fontSize: fontSize.sm, color: colors.mutedForeground },
})