import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { SearchInput } from '../components/ui/SearchInput'
import { StatusBadge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { ShoppingCart, Clock, User, CreditCard, ChevronRight, Package } from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { OrdersStackParamList } from '../navigation/types'

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
  const { data, refetch, isRefetching } = trpc.orders.getAllOrders.useQuery({ page: 1, limit: 100 })

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
    const date = new Date(item.createdAt)
    const itemCount = item.items?.length ?? 0
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('OrderDetail', { order: item })}>
        <Card style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{item.id.slice(-6)}</Text>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.orderBody}>
            <View style={styles.infoRow}>
              <CreditCard size={14} color={colors.mutedForeground} />
              <Text style={styles.infoText}>{item.total?.toLocaleString('ru-RU')} ₽</Text>
            </View>
            <View style={styles.infoRow}>
              <User size={14} color={colors.mutedForeground} />
              <Text style={styles.infoText} numberOfLines={1}>{item.user?.name || item.user?.email || ''}</Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={14} color={colors.mutedForeground} />
              <Text style={styles.infoText}>{date.toLocaleDateString('ru-RU')}</Text>
            </View>
            <View style={styles.infoRow}>
              <Package size={14} color={colors.mutedForeground} />
              <Text style={styles.infoText}>{itemCount} {itemCount === 1 ? 'товар' : itemCount < 5 ? 'товара' : 'товаров'}</Text>
            </View>
          </View>
          <View style={styles.orderFooter}>
            <Text style={styles.detailLink}>Подробнее</Text>
            <ChevronRight size={14} color={colors.primary} />
          </View>
        </Card>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><ShoppingCart size={18} color={colors.primary} /></View>
          <Text style={styles.headerTitle}>ЗАКАЗЫ</Text>
        </View>
      </View>
      <View style={styles.searchRow}>
        <SearchInput value={search} onChangeText={setSearch} placeholder="Поиск по ID или клиенту..." />
      </View>
      <View style={styles.tabsRow}>
        <FlatList
          horizontal showsHorizontalScrollIndicator={false}
          data={TABS} keyExtractor={t => t.key}
          contentContainerStyle={styles.tabsContent}
          renderItem={({ item: t }) => {
            const active = t.key === tab
            const count = t.key === 'ALL' ? allOrders.length : allOrders.filter((o: any) => o.status === t.key).length
            return (
              <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t.key)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
                <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      </View>
      <FlatList
        data={orders} keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        contentContainerStyle={styles.list} renderItem={renderOrder}
        ListEmptyComponent={<EmptyState icon={<ShoppingCart size={36} color={colors.mutedForeground + '40'} />} title="Заказов нет" description={search ? 'Попробуйте другой запрос' : 'Заказы появятся здесь'} />}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.primary + '1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, letterSpacing: 3, color: colors.foreground },
  searchRow: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tabsRow: { paddingBottom: spacing.sm },
  tabsContent: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fontSize.sm, color: colors.mutedForeground },
  tabTextActive: { color: colors.primaryForeground, fontWeight: fontWeight.medium },
  tabBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.mutedForeground },
  tabBadgeTextActive: { color: colors.primaryForeground },
  list: { padding: spacing.lg, paddingTop: spacing.xs },
  orderCard: { marginBottom: spacing.sm },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  orderId: { fontSize: fontSize.sm, fontFamily: 'monospace', fontWeight: fontWeight.semibold, color: colors.foreground },
  orderBody: { gap: spacing.xs },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  infoText: { fontSize: fontSize.sm, color: colors.mutedForeground, flex: 1 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: spacing.md, gap: 4 },
  detailLink: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.primary },
})