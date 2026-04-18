import { useState } from 'react'
import {
	View,
	Text,
	Pressable,
	StyleSheet,
	Alert,
	ScrollView,
	Platform,
} from 'react-native'
import { trpc } from '../lib/trpc'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
	elevation,
	ripple,
} from '../theme'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import {
	ArrowDownToLine,
	FileJson,
	FileSpreadsheet,
	FolderInput,
	Upload,
	CheckCircle,
} from 'lucide-react-native'

export function ImportExportScreen() {
	const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json')
	const [exporting, setExporting] = useState(false)
	const [exported, setExported] = useState(false)
	const { showToast } = useToast()

	const exportMut = trpc.admin.exportProducts.useMutation({
		onSuccess: () => {
			setExported(true)
			showToast('Экспорт завершён', 'success')
			setTimeout(() => setExported(false), 3000)
		},
		onError: (err: any) => showToast(err.message, 'error'),
	})

	const handleExport = () => {
		setExporting(true)
		exportMut.mutate(
			{ format: exportFormat },
			{ onSettled: () => setExporting(false) },
		)
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<ScreenHeader
				title='Импорт/Экспорт'
				showBack
				icon={
					<View style={styles.headerIcon}>
						<ArrowDownToLine size={20} color={colors.primaryForeground} />
					</View>
				}
			/>
			<Text style={styles.sectionTitle}>Экспорт товаров</Text>
			<View style={styles.formatRow}>
				<Pressable
					android_ripple={ripple.ghost}
					style={[
						styles.formatCard,
						exportFormat === 'json' && styles.formatActive,
						elevation(1),
						Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
					]}
					onPress={() => setExportFormat('json')}
				>
					<FileJson
						size={28}
						color={
							exportFormat === 'json' ? colors.primary : colors.mutedForeground
						}
					/>
					<Text
						style={[
							styles.formatLabel,
							exportFormat === 'json' && styles.formatLabelActive,
						]}
					>
						JSON
					</Text>
				</Pressable>
				<Pressable
					android_ripple={ripple.ghost}
					style={[
						styles.formatCard,
						exportFormat === 'csv' && styles.formatActive,
						elevation(1),
						Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
					]}
					onPress={() => setExportFormat('csv')}
				>
					<FileSpreadsheet
						size={28}
						color={
							exportFormat === 'csv' ? colors.primary : colors.mutedForeground
						}
					/>
					<Text
						style={[
							styles.formatLabel,
							exportFormat === 'csv' && styles.formatLabelActive,
						]}
					>
						CSV
					</Text>
				</Pressable>
			</View>
			<Button
				title={exported ? 'Экспортировано!' : 'Экспортировать'}
				onPress={handleExport}
				loading={exporting}
				icon={
					exported ? (
						<CheckCircle size={16} color={colors.primaryForeground} />
					) : (
						<ArrowDownToLine size={16} color={colors.primaryForeground} />
					)
				}
				style={styles.exportBtn}
			/>
			<Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
				Импорт товаров
			</Text>
			<Card style={styles.importArea}>
				<FolderInput size={36} color={colors.mutedForeground + '60'} />
				<Text style={styles.importText}>
					Функция импорта доступна в веб-версии
				</Text>
				<Text style={styles.importSubText}>
					Откройте панель администратора на компьютере
				</Text>
			</Card>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.lg },
	headerIcon: {
		width: 38,
		height: 38,
		borderRadius: borderRadius.md,
		backgroundColor: colors.primary,
		justifyContent: 'center',
		alignItems: 'center',
	},
	sectionTitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.md,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		marginBottom: spacing.md,
	},
	formatRow: {
		flexDirection: 'row',
		gap: spacing.md,
		marginBottom: spacing.lg,
	},
	formatCard: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing.xl,
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		gap: spacing.sm,
		borderWidth: 1,
		borderColor: colors.borderLight,
		...elevation(1),
	},
	formatActive: {
		borderColor: colors.primary,
		backgroundColor: colors.primary + '0D',
	},
	formatLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
	},
	formatLabelActive: { color: colors.primary },
	exportBtn: { marginBottom: spacing.lg },
	importArea: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: spacing['2xl'],
		gap: spacing.sm,
	},
	importText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
		textAlign: 'center',
	},
	importSubText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.mutedForeground + '80',
		textAlign: 'center',
	},
})
