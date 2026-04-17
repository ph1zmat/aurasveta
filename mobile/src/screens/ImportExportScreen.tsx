import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ArrowDownToLine, FileJson, FileSpreadsheet, FolderInput, Upload, CheckCircle } from 'lucide-react-native'

export function ImportExportScreen() {
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
  const [exporting, setExporting] = useState(false)
  const [exported, setExported] = useState(false)

  const exportMut = trpc.admin.exportProducts.useMutation({
    onSuccess: () => { setExported(true); setTimeout(() => setExported(false), 3000) },
    onError: (err: any) => Alert.alert('Ошибка', err.message),
  })

  const handleExport = () => {
    setExporting(true)
    exportMut.mutate({ format: exportFormat }, { onSettled: () => setExporting(false) })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}><ArrowDownToLine size={18} color={colors.statusDelivered} /></View>
          <Text style={styles.headerTitle}>ИМПОРТ/ЭКСПОРТ</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Экспорт товаров</Text>
      <View style={styles.formatRow}>
        <TouchableOpacity style={[styles.formatCard, exportFormat === 'json' && styles.formatActive]} onPress={() => setExportFormat('json')}>
          <FileJson size={28} color={exportFormat === 'json' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.formatLabel, exportFormat === 'json' && styles.formatLabelActive]}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.formatCard, exportFormat === 'csv' && styles.formatActive]} onPress={() => setExportFormat('csv')}>
          <FileSpreadsheet size={28} color={exportFormat === 'csv' ? colors.primary : colors.mutedForeground} />
          <Text style={[styles.formatLabel, exportFormat === 'csv' && styles.formatLabelActive]}>CSV</Text>
        </TouchableOpacity>
      </View>
      <Button title={exported ? 'Экспортировано!' : 'Экспортировать'} onPress={handleExport} loading={exporting} icon={exported ? <CheckCircle size={16} color={colors.primaryForeground} /> : <ArrowDownToLine size={16} color={colors.primaryForeground} />} style={styles.exportBtn} />
      <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>Импорт товаров</Text>
      <Card style={styles.importArea}>
        <FolderInput size={36} color={colors.mutedForeground + '60'} />
        <Text style={styles.importText}>Функция импорта доступна в веб-версии</Text>
        <Text style={styles.importSubText}>Откройте панель администратора на компьютере</Text>
      </Card>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIcon: { width: 36, height: 36, borderRadius: borderRadius.sm, backgroundColor: colors.statusDelivered + '1A', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, letterSpacing: 3, color: colors.foreground },
  sectionTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.foreground, marginBottom: spacing.md },
  formatRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  formatCard: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl, backgroundColor: colors.card, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  formatActive: { borderColor: colors.primary, backgroundColor: colors.primary + '0D' },
  formatLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.mutedForeground },
  formatLabelActive: { color: colors.primary },
  exportBtn: { marginBottom: spacing.lg },
  importArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['2xl'], gap: spacing.sm },
  importText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.mutedForeground, textAlign: 'center' },
  importSubText: { fontSize: fontSize.xs, color: colors.mutedForeground + '80', textAlign: 'center' },
})