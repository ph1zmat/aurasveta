import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { EmptyState } from '../components/ui/EmptyState'
import { FolderOpen, ChevronRight, ImagePlus } from 'lucide-react-native'

export function CategoriesScreen() {
  const { data: tree, refetch, isRefetching } = trpc.categories.getTree.useQuery()
  const apiUrl = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'

  const flattenTree = (items: any[], level = 0): any[] => {
    const result: any[] = []
    for (const item of items) {
      result.push({ ...item, level })
      if (item.children?.length) result.push(...flattenTree(item.children, level + 1))
    }
    return result
  }

  const flatList = tree ? flattenTree(tree) : []

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><FolderOpen size={18} color={colors.primary} /></View>
          <Text style={styles.headerTitle}>КАТЕГОРИИ</Text>
        </View>
      </View>
      <FlatList
        data={flatList} keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: any }) => {
          const imageUrl = item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${apiUrl}${item.imagePath}`) : null
          return (
            <View style={[styles.row, { marginLeft: item.level * spacing.xl }]}>
              <View style={styles.imageBox}>
                {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.catImage} resizeMode="cover" /> : <ImagePlus size={18} color={colors.mutedForeground + '50'} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.slug}>/{item.slug}</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{item._count?.products ?? 0}</Text>
              </View>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </View>
          )
        }}
        ListEmptyComponent={<EmptyState icon={<FolderOpen size={36} color={colors.mutedForeground + '40'} />} title="Нет категорий" description="Категории пока не созданы" />}
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
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.md, backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  imageBox: { width: 40, height: 40, borderRadius: borderRadius.sm, backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  catImage: { width: 40, height: 40 },
  name: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground },
  slug: { fontSize: fontSize.xs, color: colors.mutedForeground },
  countBadge: { minWidth: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary + '1A', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  countText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.primary },
})