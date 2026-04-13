import { useState } from 'react'
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'

export function ProductsScreen() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, refetch, isRefetching } = trpc.products.getMany.useQuery({
    page, limit: 20, search: search || undefined,
  })
  const deleteMut = trpc.products.delete.useMutation({ onSuccess: () => refetch() })

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Поиск по названию..."
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item }: { item: any }) => (
          <View style={styles.productCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productInfo}>
                {item.price?.toLocaleString('ru-RU')} ₽ · Остаток: {item.stock}
              </Text>
              <Text style={styles.productCategory}>{item.category?.name ?? 'Без категории'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={[styles.badge, item.isActive ? styles.badgeGreen : styles.badgeRed]}>
                <Text style={[styles.badgeText, item.isActive ? styles.badgeTextGreen : styles.badgeTextRed]}>
                  {item.isActive ? 'Активный' : 'Скрытый'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert('Удалить?', `Удалить "${item.name}"?`, [
                  { text: 'Отмена' },
                  { text: 'Удалить', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
                ])}
                style={{ marginTop: 8 }}
              >
                <Text style={{ color: '#ef4444', fontSize: 12 }}>Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Товары не найдены</Text>}
        ListFooterComponent={
          data && data.totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <Text style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>← Назад</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {data.totalPages}</Text>
              <TouchableOpacity onPress={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages}>
                <Text style={[styles.pageBtn, page === data.totalPages && styles.pageBtnDisabled]}>Далее →</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchInput: {
    height: 44, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 12,
    paddingHorizontal: 16, margin: 12, fontSize: 14, backgroundColor: '#fafafa',
  },
  productCard: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  productName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  productInfo: { fontSize: 12, color: '#666' },
  productCategory: { fontSize: 12, color: '#999', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 10, fontWeight: '500' },
  badgeTextGreen: { color: '#15803d' },
  badgeTextRed: { color: '#dc2626' },
  emptyText: { textAlign: 'center', padding: 40, color: '#999', fontSize: 14 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, gap: 16 },
  pageBtn: { fontSize: 14, color: '#000', fontWeight: '500' },
  pageBtnDisabled: { color: '#ccc' },
  pageInfo: { fontSize: 12, color: '#999' },
})
