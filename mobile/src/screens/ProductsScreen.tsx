import { useState } from 'react'
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { SearchInput } from '../components/ui/SearchInput'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Package, Pencil, Trash2, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { ProductsStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<ProductsStackParamList, 'ProductsList'>

export function ProductsScreen({ navigation }: Props) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const { data, refetch, isRefetching } = trpc.products.getMany.useQuery({
    page, limit: 20, search: search || undefined,
  })
  const utils = trpc.useUtils()
  const deleteMut = trpc.products.delete.useMutation({
    onSuccess: () => utils.products.getMany.invalidate(),
  })

  const apiUrl = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.imagePath
      ? (item.imagePath.startsWith('http') ? item.imagePath : `${apiUrl}${item.imagePath}`)
      : null
    const isLeft = index % 2 === 0

    return (
      <View style={[styles.gridItem, isLeft ? { paddingRight: spacing.xs } : { paddingLeft: spacing.xs }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ProductForm', { id: item.id })}
          style={styles.productCard}
        >
          <View style={[styles.statusDot, { backgroundColor: item.isActive ? '#34d399' : '#f87171' }]} />
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('ProductForm', { id: item.id })}>
              <Pencil size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => Alert.alert('Удалить?', `"${item.name}"`, [
                { text: 'Отмена' },
                { text: 'Удалить', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
              ])}
            >
              <Trash2 size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.productImage, styles.imagePlaceholder]}>
                <ImagePlus size={28} color={colors.mutedForeground + '50'} />
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.productPrice}>{item.price?.toLocaleString('ru-RU')} ₽</Text>
              {item.compareAtPrice != null && item.compareAtPrice > 0 && (
                <Text style={styles.oldPrice}>{item.compareAtPrice.toLocaleString('ru-RU')} ₽</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><Package size={18} color={colors.primary} /></View>
          <Text style={styles.headerTitle}>ТОВАРЫ</Text>
        </View>
        <Button title="Добавить" size="sm" onPress={() => navigation.navigate('ProductForm')} />
      </View>
      <View style={styles.searchRow}>
        <SearchInput value={search} onChangeText={(v) => { setSearch(v); setPage(1) }} placeholder="Поиск по названию..." />
      </View>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item: any) => item.id}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={renderItem}
        ListEmptyComponent={<EmptyState icon={<Package size={36} color={colors.mutedForeground + '40'} />} title="Товары не найдены" description={search ? 'Попробуйте другой запрос' : 'Добавьте первый товар'} />}
        ListFooterComponent={
          data && data.totalPages > 1 ? (
            <View style={styles.pagination}>
              <TouchableOpacity onPress={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>
                <ChevronLeft size={16} color={page === 1 ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page} / {data.totalPages}</Text>
              <TouchableOpacity onPress={() => setPage(p => Math.min(data.totalPages, p + 1))} disabled={page === data.totalPages} style={[styles.pageBtn, page === data.totalPages && styles.pageBtnDisabled]}>
                <ChevronRight size={16} color={page === data.totalPages ? colors.mutedForeground : colors.foreground} />
              </TouchableOpacity>
            </View>
          ) : null
        }
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
  list: { paddingHorizontal: spacing.lg - spacing.xs, paddingTop: spacing.sm },
  gridItem: { width: '50%' as any, paddingBottom: spacing.sm },
  productCard: { borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, overflow: 'hidden' },
  statusDot: { position: 'absolute', top: spacing.sm, left: spacing.sm, width: 8, height: 8, borderRadius: 4, zIndex: 2 },
  cardActions: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row', gap: 4, zIndex: 2 },
  actionBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', aspectRatio: 1 },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' },
  productInfo: { padding: spacing.sm },
  productName: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  productPrice: { fontSize: fontSize.sm, fontWeight: fontWeight.bold, color: colors.primary },
  oldPrice: { fontSize: fontSize.xs, color: colors.mutedForeground, textDecorationLine: 'line-through' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.lg },
  pageBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' },
  pageBtnDisabled: { opacity: 0.4 },
  pageInfo: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.mutedForeground },
})