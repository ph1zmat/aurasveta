import { View, Text, ScrollView, Image, FlatList, StyleSheet, Alert } from 'react-native'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { ImagePicker } from '../components/ui/ImagePicker'
import { trpc } from '../lib/trpc'
import { FolderOpen, Pencil, Trash2, Plus, ImagePlus } from 'lucide-react-native'
import type { CategoryDetailProps } from '../navigation/types'

export function CategoryDetailScreen({ route, navigation }: CategoryDetailProps) {
  const category = route.params.category
  const utils = trpc.useUtils()

  const { data: tree, refetch } = trpc.categories.getTree.useQuery()

  // Find fresh category data from tree
  const findCategory = (items: any[], id: string): any => {
    for (const item of items) {
      if (item.id === id) return item
      if (item.children?.length) {
        const found = findCategory(item.children, id)
        if (found) return found
      }
    }
    return null
  }
  const fresh = tree ? findCategory(tree, category.id) : category
  const cat = fresh ?? category

  const deleteMut = trpc.categories.delete.useMutation({
    onSuccess: () => { utils.categories.getTree.invalidate(); navigation.goBack() },
  })
  const updateImageMut = trpc.categories.updateImagePath.useMutation({
    onSuccess: () => refetch(),
  })
  const removeImageMut = trpc.categories.removeImage.useMutation({
    onSuccess: () => refetch(),
  })

  const handleDelete = () => {
    Alert.alert('Удалить категорию?', `"${cat.name}" будет удалена`, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteMut.mutate(cat.id) },
    ])
  }

  const children = cat.children ?? []
  const imageUrl = cat.image || cat.imageUrl || null
  const apiUrl = 'https://aurasveta.ru'
  const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : imageUrl ? `${apiUrl}${imageUrl}` : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Category image */}
      <ImagePicker
        imageUrl={imageUrl}
        onImageUploaded={(path) => updateImageMut.mutate({ id: cat.id, path })}
        onImageRemoved={() => removeImageMut.mutate(cat.id)}
        height={180}
      />

      {/* Info */}
      <Card style={styles.infoCard}>
        <Text style={styles.name}>{cat.name}</Text>
        <Text style={styles.slug}>/{cat.slug}</Text>
        {cat.description ? <Text style={styles.description}>{cat.description}</Text> : null}

        <View style={styles.statsRow}>
          <Badge label={`${cat._count?.products ?? 0} товаров`} color={colors.primary} bg={colors.primary + '20'} />
          <Badge label={`${children.length} подкатегорий`} color={colors.statusShipped} bg={colors.statusShippedBg} />
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <Button
          title="Редактировать"
          variant="secondary"
          size="md"
          onPress={() => navigation.navigate('CategoryForm', { id: cat.id })}
          style={{ flex: 1 }}
        />
        <Button
          title="Удалить"
          variant="destructive"
          size="md"
          onPress={handleDelete}
          loading={deleteMut.isPending}
          style={{ flex: 1, marginLeft: spacing.sm }}
        />
      </View>

      {/* Subcategories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Подкатегории</Text>
          <Button
            title="+ Добавить"
            variant="primary"
            size="sm"
            onPress={() => navigation.navigate('CategoryForm', { parentId: cat.id })}
          />
        </View>

        {children.length === 0 ? (
          <Text style={styles.emptyText}>Нет подкатегорий</Text>
        ) : (
          children.map((child: any) => (
            <Card key={child.id} style={styles.childCard}>
              <View style={styles.childRow}>
                {child.image ? (
                  <Image
                    source={{ uri: child.image.startsWith('http') ? child.image : `${apiUrl}${child.image}` }}
                    style={styles.childImage}
                  />
                ) : (
                  <View style={[styles.childImage, styles.childImagePlaceholder]}>
                    <FolderOpen size={16} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childSlug}>/{child.slug}</Text>
                  <Text style={styles.childCount}>{child._count?.products ?? 0} товаров</Text>
                </View>
                <View style={styles.childActions}>
                  <Button
                    title=""
                    variant="ghost"
                    size="sm"
                    onPress={() => navigation.navigate('CategoryForm', { id: child.id })}
                    icon={<Pencil size={14} color={colors.primary} />}
                  />
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <View style={{ height: spacing['2xl'] }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  infoCard: { marginTop: spacing.md, marginBottom: spacing.md },
  name: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.foreground },
  slug: { fontSize: fontSize.sm, color: colors.mutedForeground, fontFamily: 'monospace', marginTop: 2 },
  description: { fontSize: fontSize.base, color: colors.foreground, marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  actionsRow: { flexDirection: 'row', marginBottom: spacing.lg },
  section: { marginTop: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.foreground },
  emptyText: { fontSize: fontSize.sm, color: colors.mutedForeground, textAlign: 'center', paddingVertical: spacing.xl },
  childCard: { marginBottom: spacing.sm },
  childRow: { flexDirection: 'row', alignItems: 'center' },
  childImage: { width: 44, height: 44, borderRadius: borderRadius.sm, marginRight: spacing.md },
  childImagePlaceholder: { backgroundColor: colors.muted, justifyContent: 'center', alignItems: 'center' },
  childInfo: { flex: 1 },
  childName: { fontSize: fontSize.base, fontWeight: fontWeight.medium, color: colors.foreground },
  childSlug: { fontSize: fontSize.xs, color: colors.mutedForeground, fontFamily: 'monospace' },
  childCount: { fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: 2 },
  childActions: { flexDirection: 'row' },
})
