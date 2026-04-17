import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Modal as RNModal, Alert } from 'react-native'
import { trpc } from '../lib/trpc'
import { useState } from 'react'
import { colors, fontSize, fontWeight, spacing, borderRadius, STATUS_COLORS, type StatusKey } from '../theme'
import { Card } from '../components/ui/Card'
import { StatusBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import {
  Package, ShoppingCart, Users, LayoutDashboard,
  Clock, User, TrendingUp, CircleDot, CreditCard,
  ChevronRight, ShoppingBag, X, Phone, MapPin,
  MessageSquare,
} from 'lucide-react-native'

/* ============== Status Config ============== */

const STATUS_TRANSITIONS: Record<StatusKey, { next: StatusKey; label: string }[]> = {
  PENDING: [
    { next: 'PAID', label: 'Оплачен' },
    { next: 'CANCELLED', label: 'Отменить' },
  ],
  PAID: [
    { next: 'SHIPPED', label: 'Отправить' },
    { next: 'CANCELLED', label: 'Отменить' },
  ],
  SHIPPED: [{ next: 'DELIVERED', label: 'Доставлен' }],
  DELIVERED: [],
  CANCELLED: [],
}

/* ============== Dashboard Screen ============== */

export function DashboardScreen() {
  const { data: stats, refetch: refetchStats, isRefetching: isRefetchingStats, error, isLoading } = trpc.admin.getStats.useQuery()
  const { data: recentPending, refetch: refetchPending } = trpc.orders.getAllOrders.useQuery({ status: 'PENDING', page: 1, limit: 8 })
  const { data: recentPaid, refetch: refetchPaid } = trpc.orders.getAllOrders.useQuery({ status: 'PAID', page: 1, limit: 4 })
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  if (__DEV__) {
    console.log('[DASHBOARD] isLoading:', isLoading, 'error:', error?.message, 'stats:', stats ? 'loaded' : 'null')
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refetchStats(), refetchPending(), refetchPaid()])
    setRefreshing(false)
  }

  const pendingOrders = recentPending?.items ?? []
  const paidOrders = recentPaid?.items ?? []

  const statCards = [
    { label: 'Товары', value: stats?.totalProducts ?? 0, Icon: Package, color: colors.statusPaid, bg: colors.statusPaidBg },
    { label: 'Заказы', value: stats?.totalOrders ?? 0, Icon: ShoppingCart, color: colors.statusDelivered, bg: colors.statusDeliveredBg },
    { label: 'Пользователи', value: stats?.totalUsers ?? 0, Icon: Users, color: colors.statusShipped, bg: colors.statusShippedBg },
  ]

  const maxQuantity = Math.max(...(stats?.topProducts?.map((tp: any) => tp._sum?.quantity ?? 0) ?? [1]))

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing || isRefetchingStats} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Ошибка загрузки: {error.message}</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <LayoutDashboard size={18} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>ДАШБОРД</Text>
      </View>

      {/* Stat cards */}
      <View style={styles.statsGrid}>
        {statCards.map(card => (
          <Card key={card.label} style={styles.statCard}>
            <View style={styles.statCardTop}>
              <Text style={styles.statLabel}>{card.label}</Text>
              <View style={[styles.statIconBox, { backgroundColor: card.bg }]}>
                <card.Icon size={16} color={card.color} />
              </View>
            </View>
            <Text style={styles.statValue}>{card.value.toLocaleString('ru-RU')}</Text>
          </Card>
        ))}
      </View>

      {/* Pending orders */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <CircleDot size={14} color={colors.statusPending} style={{ marginRight: 6 }} />
            <Text style={styles.sectionTitle}>НОВЫЕ ЗАКАЗЫ</Text>
          </View>
          {pendingOrders.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.statusPendingBg }]}>
              <Text style={[styles.countBadgeText, { color: colors.statusPending }]}>
                {recentPending?.total ?? 0}
              </Text>
            </View>
          )}
        </View>

        {pendingOrders.length > 0 ? (
          <View style={styles.ordersGrid}>
            {pendingOrders.map((order: any) => (
              <MiniOrderCard key={order.id} order={order} onPress={() => setSelectedOrder(order)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <ShoppingBag size={28} color={colors.mutedForeground} style={{ opacity: 0.2, marginBottom: 4 }} />
            <Text style={styles.emptyText}>Нет новых заказов</Text>
          </View>
        )}
      </View>

      {/* Paid orders */}
      {paidOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <CreditCard size={14} color={colors.statusPaid} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>ОПЛАЧЕННЫЕ</Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.statusPaidBg }]}>
              <Text style={[styles.countBadgeText, { color: colors.statusPaid }]}>
                {recentPaid?.total ?? 0}
              </Text>
            </View>
          </View>
          <View style={styles.ordersGrid}>
            {paidOrders.map((order: any) => (
              <MiniOrderCard key={order.id} order={order} onPress={() => setSelectedOrder(order)} />
            ))}
          </View>
        </View>
      )}

      {/* Top products */}
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <TrendingUp size={14} color={colors.statusDelivered} style={{ marginRight: 6 }} />
          <Text style={styles.sectionTitle}>ТОП ТОВАРОВ</Text>
        </View>

        {stats?.topProducts && stats.topProducts.length > 0 ? (
          <View style={styles.ordersGrid}>
            {stats.topProducts.map((tp: any) => {
              const qty = tp._sum?.quantity ?? 0
              const pct = maxQuantity > 0 ? (qty / maxQuantity) * 100 : 0
              return (
                <Card key={tp.productId} style={styles.topProductCard}>
                  <View style={styles.topBarIndicator}>
                    <View style={[styles.topBar, { width: `${pct}%` as any }]} />
                  </View>
                  <Text style={styles.topProductName} numberOfLines={1}>
                    {tp.product?.name ?? tp.productId}
                  </Text>
                  <View style={styles.topProductStats}>
                    <Package size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                    <Text style={styles.topProductQty}>{qty}</Text>
                    <Text style={styles.topProductUnit}>шт.</Text>
                  </View>
                </Card>
              )
            })}
          </View>
        ) : (
          <View style={styles.emptyBlock}>
            <TrendingUp size={28} color={colors.mutedForeground} style={{ opacity: 0.2, marginBottom: 4 }} />
            <Text style={styles.emptyText}>Нет данных</Text>
          </View>
        )}
      </View>

      <View style={{ height: spacing['2xl'] }} />

      {/* Order detail modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={() => {
            refetchPending()
            refetchPaid()
            refetchStats()
            setSelectedOrder(null)
          }}
        />
      )}
    </ScrollView>
  )
}

/* ============== Mini Order Card ============== */

function MiniOrderCard({ order, onPress }: { order: any; onPress: () => void }) {
  const status = (order.status as StatusKey) ?? 'PENDING'
  const st = STATUS_COLORS[status]
  const date = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
  const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'
  const itemCount = order.items?.length ?? 0

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.miniCardWrapper}>
      <View style={[styles.miniCard, { borderColor: colors.border }]}>
        {/* Top color bar */}
        <View style={[styles.miniCardBar, { backgroundColor: st.bg }]} />

        <View style={styles.miniCardBody}>
          {/* ID + status */}
          <View style={styles.miniCardRow}>
            <Text style={styles.miniCardId}>#{order.id.slice(-6)}</Text>
            <StatusBadge status={status} />
          </View>

          {/* Total */}
          <Text style={styles.miniCardTotal}>
            {order.total?.toLocaleString('ru-RU')} ₽
          </Text>

          {/* Customer */}
          <View style={styles.miniCardRow}>
            <User size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
            <Text style={styles.miniCardCustomer} numberOfLines={1}>{customerName}</Text>
          </View>

          {/* Date + item count */}
          <View style={[styles.miniCardRow, { marginTop: 'auto' as any }]}>
            <View style={styles.miniCardMeta}>
              <Clock size={12} color={colors.mutedForeground} style={{ marginRight: 2 }} />
              <Text style={styles.miniCardMetaText}>{date}</Text>
            </View>
            <View style={styles.miniCardMeta}>
              <Package size={12} color={colors.mutedForeground} style={{ marginRight: 2 }} />
              <Text style={styles.miniCardMetaText}>{itemCount}</Text>
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity style={styles.miniCardBtn} onPress={onPress}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.miniCardBtnText}>Подробнее</Text>
              <ChevronRight size={12} color={colors.primary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
}

/* ============== Order Modal ============== */

function OrderModal({ order, onClose, onStatusChange }: { order: any; onClose: () => void; onStatusChange: () => void }) {
  const utils = trpc.useUtils()
  const updateStatus = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      utils.orders.getAllOrders.invalidate()
      utils.admin.getStats.invalidate()
      onStatusChange()
    },
  })

  const status = order.status as StatusKey
  const st = STATUS_COLORS[status]
  const transitions = STATUS_TRANSITIONS[status] ?? []

  const date = new Date(order.createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const customerName = order.user?.name ?? order.user?.email ?? 'Аноним'
  const items = order.items ?? []

  const handleStatusChange = (next: StatusKey) => {
    const label = STATUS_COLORS[next].label
    Alert.alert('Изменить статус', `Установить статус "${label}"?`, [
      { text: 'Отмена' },
      { text: 'Да', onPress: () => updateStatus.mutate({ id: order.id, status: next }) },
    ])
  }

  return (
    <RNModal visible animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={[styles.modalStatusIcon, { backgroundColor: st.bg }]}>
                <StatusBadge status={status} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Заказ #{order.id.slice(-6)}</Text>
                <Text style={styles.modalDate}>{date}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <X size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Customer */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Клиент</Text>
              <ModalInfoRow icon="user" label="Имя" value={customerName} />
              {order.phone ? <ModalInfoRow icon="phone" label="Телефон" value={order.phone} /> : null}
              {order.address ? <ModalInfoRow icon="map" label="Адрес" value={order.address} /> : null}
              {order.comment ? <ModalInfoRow icon="message" label="Комментарий" value={order.comment} /> : null}
            </View>

            {/* Items */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Товары ({items.length})</Text>
              {items.map((item: any, i: number) => (
                <View key={item.id ?? i} style={[styles.modalItemRow, i < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border + '40' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalItemName} numberOfLines={2}>
                      {item.product?.name ?? 'Товар'}
                    </Text>
                    <Text style={styles.modalItemQty}>
                      {item.quantity} × {item.price?.toLocaleString('ru-RU')} ₽
                    </Text>
                  </View>
                  <Text style={styles.modalItemTotal}>
                    {((item.quantity ?? 1) * (item.price ?? 0)).toLocaleString('ru-RU')} ₽
                  </Text>
                </View>
              ))}
              {/* Total */}
              <View style={styles.modalTotalRow}>
                <Text style={styles.modalTotalLabel}>Итого</Text>
                <Text style={styles.modalTotalValue}>{order.total?.toLocaleString('ru-RU')} ₽</Text>
              </View>
            </View>

            {/* Status transitions */}
            {transitions.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Действия</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {transitions.map(t => (
                    <Button
                      key={t.next}
                      title={t.label}
                      variant={t.next === 'CANCELLED' ? 'destructive' : 'primary'}
                      size="md"
                      onPress={() => handleStatusChange(t.next)}
                      loading={updateStatus.isPending}
                      style={{ flex: 1 }}
                    />
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  )
}

function ModalInfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const iconMap: Record<string, React.ComponentType<any>> = {
    user: User, phone: Phone, map: MapPin, message: MessageSquare,
  }
  const IconComp = iconMap[icon]
  return (
    <View style={styles.modalInfoRow}>
      {IconComp && <IconComp size={14} color={colors.mutedForeground} style={{ marginRight: 6 }} />}
      <Text style={styles.modalInfoLabel}>{label}</Text>
      <Text style={styles.modalInfoValue}>{value}</Text>
    </View>
  )
}

/* ============== Styles ============== */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  errorBanner: { backgroundColor: '#fee2e2', padding: spacing.md, margin: spacing.lg, borderRadius: borderRadius.lg },
  errorText: { color: '#dc2626', fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.primary + '1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, letterSpacing: 3, color: colors.foreground },

  // Stats grid
  statsGrid: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm },
  statCard: { flex: 1, paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  statCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  statLabel: { fontSize: fontSize.xs, color: colors.mutedForeground, flexShrink: 1 },
  statIconBox: { width: 28, height: 28, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, color: colors.foreground, marginTop: spacing.xs },

  // Section
  section: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 2, color: colors.mutedForeground },
  countBadge: { borderRadius: borderRadius.full, paddingHorizontal: 8, paddingVertical: 2, marginBottom: spacing.md },
  countBadgeText: { fontSize: 10, fontWeight: fontWeight.semibold },

  // Orders grid
  ordersGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },

  // Mini card
  miniCardWrapper: { width: '48%' as any },
  miniCard: { borderRadius: borderRadius.lg, borderWidth: 1, backgroundColor: colors.card, overflow: 'hidden' },
  miniCardBar: { height: 3 },
  miniCardBody: { padding: spacing.md, gap: spacing.sm },
  miniCardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  miniCardId: { fontFamily: 'monospace', fontSize: 10, color: colors.mutedForeground },
  miniCardTotal: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.foreground },
  miniCardCustomer: { fontSize: fontSize.xs, color: colors.mutedForeground, flex: 1 },
  miniCardMeta: { flexDirection: 'row', alignItems: 'center' },
  miniCardMetaText: { fontSize: 10, color: colors.mutedForeground },
  miniCardBtn: { backgroundColor: colors.primary + '1A', borderRadius: borderRadius.sm, paddingVertical: 6, alignItems: 'center', marginTop: spacing.xs },
  miniCardBtnText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.primary },

  // Empty block
  emptyBlock: { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, borderRadius: borderRadius.lg, paddingVertical: spacing['3xl'], alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card + '80' },
  emptyText: { fontSize: fontSize.sm, color: colors.mutedForeground },

  // Top product card
  topProductCard: { width: '48%' as any, paddingHorizontal: spacing.md, paddingVertical: spacing.md, paddingTop: 0, overflow: 'hidden' },
  topBarIndicator: { height: 3, backgroundColor: colors.muted, marginBottom: spacing.sm, marginHorizontal: -spacing.md },
  topBar: { height: 3, backgroundColor: colors.statusDelivered + '50' },
  topProductName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground },
  topProductStats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
  topProductQty: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.foreground },
  topProductUnit: { fontSize: fontSize.xs, color: colors.mutedForeground, marginLeft: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: spacing.lg },
  modalContainer: { backgroundColor: colors.card, borderRadius: borderRadius.xl, maxHeight: '90%' as any, borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  modalStatusIcon: { width: 40, height: 40, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground },
  modalDate: { fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: borderRadius.full, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' },
  modalBody: { padding: spacing.lg },
  modalSection: { marginBottom: spacing.lg },
  modalSectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md },
  modalInfoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border + '40' },
  modalInfoLabel: { fontSize: fontSize.sm, color: colors.mutedForeground, width: 100 },
  modalInfoValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground, flex: 1 },
  modalItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  modalItemName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground },
  modalItemQty: { fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 },
  modalItemTotal: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.foreground },
  modalTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.md, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  modalTotalLabel: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.foreground },
  modalTotalValue: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.primary },
})
