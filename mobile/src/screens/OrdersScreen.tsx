import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает', PAID: 'Оплачен', SHIPPED: 'Отправлен', DELIVERED: 'Доставлен', CANCELLED: 'Отменён',
}
const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const

export function OrdersScreen() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data, refetch, isRefetching } = trpc.orders.getAllOrders.useQuery({
    page, limit: 20,
    status: statusFilter ? statusFilter as any : undefined,
  })
  const updateStatus = trpc.orders.updateStatus.useMutation({ onSuccess: () => refetch() })

  return (
    <View style={styles.container}>
      {/* Status filter chips */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.chip, !statusFilter && styles.chipActive]}
          onPress={() => { setStatusFilter(''); setPage(1) }}
        >
          <Text style={[styles.chipText, !statusFilter && styles.chipTextActive]}>Все</Text>
        </TouchableOpacity>
        {STATUSES.map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
            onPress={() => { setStatusFilter(s); setPage(1) }}
          >
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
              {STATUS_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item: order }: { item: any }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>#{order.id.slice(0, 8)}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString('ru-RU')}
              </Text>
            </View>
            <Text style={styles.orderCustomer}>{order.user?.name ?? order.user?.email}</Text>
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>{order.total.toLocaleString('ru-RU')} ₽</Text>
              <Text style={styles.orderItems}>{order.items?.length ?? 0} товаров</Text>
            </View>
            {/* Status buttons */}
            <View style={styles.statusRow}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusBtn, order.status === s && styles.statusBtnActive]}
                  onPress={() => updateStatus.mutate({ id: order.id, status: s })}
                >
                  <Text style={[styles.statusBtnText, order.status === s && styles.statusBtnTextActive]}>
                    {STATUS_LABELS[s]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Заказы не найдены</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#f5f5f5' },
  chipActive: { backgroundColor: '#000' },
  chipText: { fontSize: 12, color: '#666' },
  chipTextActive: { color: '#fff' },
  orderCard: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderId: { fontSize: 12, fontFamily: 'monospace', color: '#666' },
  orderDate: { fontSize: 12, color: '#999' },
  orderCustomer: { fontSize: 14, fontWeight: '500', marginVertical: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  orderTotal: { fontSize: 14, fontWeight: '600' },
  orderItems: { fontSize: 12, color: '#999' },
  statusRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  statusBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#f5f5f5' },
  statusBtnActive: { backgroundColor: '#000' },
  statusBtnText: { fontSize: 10, color: '#666' },
  statusBtnTextActive: { color: '#fff', fontWeight: '500' },
  emptyText: { textAlign: 'center', padding: 40, color: '#999' },
})
