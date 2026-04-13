import { useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { trpc } from '../lib/trpc'

export function CategoriesScreen() {
  const { data: tree, refetch, isRefetching } = trpc.categories.getTree.useQuery()

  // Flatten tree for FlatList
  const flattenTree = (items: any[], level = 0): any[] => {
    const result: any[] = []
    for (const item of items) {
      result.push({ ...item, level })
      if (item.children?.length) {
        result.push(...flattenTree(item.children, level + 1))
      }
    }
    return result
  }

  const flatList = tree ? flattenTree(tree) : []

  return (
    <View style={styles.container}>
      <FlatList
        data={flatList}
        keyExtractor={(item: any) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.row, { paddingLeft: 16 + item.level * 24 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.slug}>/{item.slug}</Text>
            </View>
            <Text style={styles.count}>{item._count?.products ?? 0}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Нет категорий</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  name: { fontSize: 14, fontWeight: '500' },
  slug: { fontSize: 12, color: '#999' },
  count: { fontSize: 12, color: '#999' },
  emptyText: { textAlign: 'center', padding: 40, color: '#999' },
})
