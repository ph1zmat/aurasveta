import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'
import { useState } from 'react'

export function DashboardScreen() {
  const { data: stats, refetch, isRefetching } = trpc.admin.getStats.useQuery()
  const [refreshing, setRefreshing] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const cards = [
    { label: 'Товары', value: stats?.totalProducts ?? 0 },
    { label: 'Заказы', value: stats?.totalOrders ?? 0 },
    { label: 'Пользователи', value: stats?.totalUsers ?? 0 },
    { label: 'Выручка', value: `${(stats?.totalRevenue ?? 0).toLocaleString('ru-RU')} ₽` },
  ]

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || isRefetching} onRefresh={onRefresh} />}
    >
      <View style={styles.grid}>
        {cards.map(card => (
          <View key={card.label} style={styles.card}>
            <Text style={styles.cardLabel}>{card.label}</Text>
            <Text style={styles.cardValue}>{card.value}</Text>
          </View>
        ))}
      </View>

      {/* Recent orders */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ПОСЛЕДНИЕ ЗАКАЗЫ</Text>
        {stats?.recentOrders?.map((order: any) => (
          <View key={order.id} style={styles.orderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.orderName}>{order.user?.name ?? order.user?.email}</Text>
              <Text style={styles.orderDate}>
                {new Date(order.createdAt).toLocaleDateString('ru-RU')}
              </Text>
            </View>
            <View>
              <Text style={styles.orderTotal}>{order.total.toLocaleString('ru-RU')} ₽</Text>
              <View style={[styles.badge, order.status === 'DELIVERED' && styles.badgeGreen]}>
                <Text style={styles.badgeText}>{order.status}</Text>
              </View>
            </View>
          </View>
        ))}
        {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
          <Text style={styles.emptyText}>Заказов пока нет</Text>
        )}
      </View>

      {/* Top products */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ТОП ТОВАРОВ</Text>
        {stats?.topProducts?.map((tp: any) => (
          <View key={tp.productId} style={styles.orderRow}>
            <Text style={{ flex: 1, fontSize: 14 }}>{tp.product?.name ?? tp.productId}</Text>
            <Text style={styles.orderDate}>{tp._sum?.quantity ?? 0} шт.</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 8 },
  card: {
    width: '48%', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 16,
    padding: 16, backgroundColor: '#fafafa',
  },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  cardValue: { fontSize: 22, fontWeight: '700' },
  section: { paddingHorizontal: 16, paddingVertical: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 2, color: '#333', marginBottom: 12 },
  orderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  orderName: { fontSize: 14, fontWeight: '500' },
  orderDate: { fontSize: 12, color: '#999' },
  orderTotal: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
  badge: { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeText: { fontSize: 10, fontWeight: '500' },
  emptyText: { fontSize: 14, color: '#999' },
})
