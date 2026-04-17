import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Webhook, Globe, Play, Trash2, Plus } from 'lucide-react-native'

const EVENTS = ['order.created', 'order.updated', 'product.created', 'product.updated', 'product.deleted']

export function WebhooksScreen() {
  const { data: webhooks, refetch, isRefetching } = trpc.webhooks.getAll.useQuery()
  const utils = trpc.useUtils()
  const createMut = trpc.webhooks.create.useMutation({ onSuccess: () => { utils.webhooks.getAll.invalidate(); setModalVisible(false) } })
  const deleteMut = trpc.webhooks.delete.useMutation({ onSuccess: () => utils.webhooks.getAll.invalidate() })
  const testMut = trpc.webhooks.test.useMutation({ onSuccess: () => Alert.alert('Тест', 'Webhook отправлен') })

  const [modalVisible, setModalVisible] = useState(false)
  const [url, setUrl] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  const toggleEvent = (ev: string) => setSelectedEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev])

  const handleCreate = () => {
    if (!url.trim() || selectedEvents.length === 0) return
    createMut.mutate({ url: url.trim(), events: selectedEvents })
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><Webhook size={18} color={colors.statusPending} /></View>
          <Text style={styles.headerTitle}>WEBHOOKS</Text>
        </View>
        <Button title="Создать" size="sm" onPress={() => { setUrl(''); setSelectedEvents([]); setModalVisible(true) }} icon={<Plus size={14} color={colors.primaryForeground} />} />
      </View>
      <FlatList
        data={webhooks ?? []} keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.whCard}>
            <View style={styles.whHeader}>
              <Globe size={14} color={colors.mutedForeground} />
              <Text style={styles.whUrl} numberOfLines={1}>{item.url}</Text>
            </View>
            <View style={styles.eventsRow}>
              {(item.events ?? []).map((ev: string) => <Badge key={ev} label={ev} color={colors.primary} bg={colors.primary + '1A'} />)}
            </View>
            <View style={styles.whActions}>
              <TouchableOpacity style={styles.testBtn} onPress={() => testMut.mutate(item.id)}>
                <Play size={14} color={colors.statusPaid} />
                <Text style={styles.testText}>Тест</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => Alert.alert('Удалить?', item.url, [{ text: 'Отмена' }, { text: 'Удалить', style: 'destructive', onPress: () => deleteMut.mutate(item.id) }])}>
                <Trash2 size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<EmptyState icon={<Webhook size={36} color={colors.mutedForeground + '40'} />} title="Нет webhook-ов" description="Создайте первый webhook" />}
      />
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Новый Webhook">
        <Input label="URL" value={url} onChangeText={setUrl} placeholder="https://example.com/hook" containerStyle={{ marginBottom: spacing.md }} />
        <Text style={styles.evLabel}>События</Text>
        <View style={styles.evChips}>
          {EVENTS.map(ev => {
            const active = selectedEvents.includes(ev)
            return (
              <TouchableOpacity key={ev} style={[styles.evChip, active && styles.evChipActive]} onPress={() => toggleEvent(ev)}>
                <Text style={[styles.evChipText, active && styles.evChipTextActive]}>{ev}</Text>
              </TouchableOpacity>
            )
          })}
        </View>
        <Button title="Создать" onPress={handleCreate} loading={createMut.isPending} style={{ marginTop: spacing.lg }} />
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.statusPending + '1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, letterSpacing: 3, color: colors.foreground },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  whCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  whHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  whUrl: { fontSize: fontSize.sm, color: colors.foreground, fontFamily: 'monospace', flex: 1 },
  eventsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  whActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  testBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.statusPaid + '1A' },
  testText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.statusPaid },
  deleteBtn: { padding: spacing.sm },
  evLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: spacing.sm },
  evChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  evChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  evChipActive: { backgroundColor: colors.primary + '20', borderColor: colors.primary },
  evChipText: { fontSize: fontSize.xs, color: colors.mutedForeground },
  evChipTextActive: { color: colors.primary, fontWeight: fontWeight.medium },
})