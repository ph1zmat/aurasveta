import { useState, useMemo } from 'react'
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, RefreshControl, Dimensions } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { FileText, Trash2, Pencil, Plus, Calendar } from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MoreStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<MoreStackParamList, 'Pages'>
const CARD_GAP = spacing.sm
const NUM_COLUMNS = 2

export function PagesScreen({ navigation }: Props) {
  const { data: pages, refetch, isRefetching } = trpc.pages.getAll.useQuery()
  const utils = trpc.useUtils()
  const deleteMut = trpc.pages.delete.useMutation({ onSuccess: () => utils.pages.getAll.invalidate() })
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!pages) return []
    const q = search.toLowerCase()
    return pages.filter((p: any) => !q || p.title?.toLowerCase().includes(q) || p.slug?.toLowerCase().includes(q))
  }, [pages, search])

  const screenWidth = Dimensions.get('window').width
  const cardWidth = (screenWidth - spacing.lg * 2 - CARD_GAP) / NUM_COLUMNS

  const handleDelete = (item: any) => {
    Alert.alert('Удалить?', `"${item.title}"`, [
      { text: 'Отмена' },
      { text: 'Удалить', style: 'destructive', onPress: () => deleteMut.mutate(item.id) },
    ])
  }

  const renderCard = ({ item, index }: { item: any; index: number }) => {
    const isLeft = index % 2 === 0
    const contentPreview = item.content ? item.content.slice(0, 80) + (item.content.length > 80 ? '...' : '') : null
    const apiUrl = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'
    const imageUrl = item.imagePath ? (item.imagePath.startsWith('http') ? item.imagePath : `${apiUrl}${item.imagePath}`) : null

    return (
      <View style={[styles.card, { width: cardWidth, marginRight: isLeft ? CARD_GAP : 0 }]}>
        {/* Cover area */}
        <View style={styles.coverArea}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <FileText size={28} color={colors.mutedForeground + '30'} />
            </View>
          )}
          {/* Status dot */}
          <View style={[styles.statusDot, { backgroundColor: item.isPublished ? '#34d399' : '#fbbf24' }]} />
          {/* Actions overlay */}
          <View style={styles.cardActions}>
            <TouchableOpacity style={styles.cardActionBtn} onPress={() => (navigation as any).navigate('PageForm', { id: item.id })}>
              <Pencil size={12} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.cardActionBtn, styles.deleteActionBtn]} onPress={() => handleDelete(item)}>
              <Trash2 size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.cardSlug} numberOfLines={1}>/{item.slug}</Text>
          {contentPreview && <Text style={styles.cardPreview} numberOfLines={3}>{contentPreview}</Text>}
          <View style={styles.cardFooter}>
            <Calendar size={11} color={colors.mutedForeground} />
            <Text style={styles.cardDate}>
              {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><FileText size={18} color={colors.statusShipped} /></View>
          <Text style={styles.headerTitle}>СТРАНИЦЫ</Text>
        </View>
        <Button title="Создать" size="sm" onPress={() => (navigation as any).navigate('PageForm')} icon={<Plus size={14} color={colors.primaryForeground} />} />
      </View>

      {pages && pages.length > 4 && (
        <SearchInput value={search} onChangeText={setSearch} placeholder="Поиск страниц..." />
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => item.id}
        numColumns={NUM_COLUMNS}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        renderItem={renderCard}
        ListEmptyComponent={
          <EmptyState
            icon={<FileText size={36} color={colors.mutedForeground + '40'} />}
            title={search ? 'Страницы не найдены' : 'Нет страниц'}
            description="Создайте первую страницу"
          />
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.statusShipped + '1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, letterSpacing: 3, color: colors.foreground },
  list: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.card, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: CARD_GAP },
  coverArea: { height: 100, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { flex: 1, backgroundColor: colors.muted + '50', justifyContent: 'center', alignItems: 'center' },
  statusDot: { position: 'absolute', left: 8, top: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' },
  cardActions: { position: 'absolute', right: 6, top: 6, flexDirection: 'row', gap: 4 },
  cardActionBtn: { width: 26, height: 26, borderRadius: borderRadius.sm, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  deleteActionBtn: {},
  cardBody: { padding: spacing.sm, gap: 3 },
  cardTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.foreground, lineHeight: 18 },
  cardSlug: { fontSize: 11, color: colors.mutedForeground, fontFamily: 'monospace' },
  cardPreview: { fontSize: 11, color: colors.mutedForeground, lineHeight: 15, marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  cardDate: { fontSize: 10, color: colors.mutedForeground },
})