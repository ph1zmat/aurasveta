import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
	elevation,
} from '../theme'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import {
	Settings,
	Server,
	AlertTriangle,
	CheckCircle,
	Info,
} from 'lucide-react-native'
import Constants from 'expo-constants'

const API_URL_KEY = 'api_url'
const DEFAULT_URL = __DEV__ ? 'http://localhost:3000' : 'https://aurasveta.ru'

export function SettingsScreen() {
	const [apiUrl, setApiUrl] = useState(DEFAULT_URL)
	const [saved, setSaved] = useState(false)

	useEffect(() => {
		AsyncStorage.getItem(API_URL_KEY).then(v => {
			if (v) setApiUrl(v)
		})
	}, [])

	const handleSave = async () => {
		await AsyncStorage.setItem(API_URL_KEY, apiUrl.trim())
		setSaved(true)
		setTimeout(() => setSaved(false), 2000)
	}

	const appVersion = Constants.expoConfig?.version ?? '1.0.0'

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.content}>
			<ScreenHeader
				title='Настройки'
				showBack
				icon={
					<View style={styles.headerIcon}>
						<Settings size={20} color={colors.primaryForeground} />
					</View>
				}
			/>
			<Text style={styles.sectionTitle}>Сервер</Text>
			<Card style={styles.section}>
				<View style={styles.serverRow}>
					<Server size={16} color={colors.mutedForeground} />
					<Text style={styles.serverLabel}>API URL</Text>
				</View>
				<Input
					value={apiUrl}
					onChangeText={setApiUrl}
					placeholder='https://aurasveta.ru'
					containerStyle={styles.inputWrap}
				/>
				<View style={styles.warningRow}>
					<AlertTriangle size={14} color={colors.statusPending} />
					<Text style={styles.warningText}>
						Изменение перезагрузит приложение
					</Text>
				</View>
				<Button
					title={saved ? 'Сохранено!' : 'Сохранить'}
					onPress={handleSave}
					icon={
						saved ? (
							<CheckCircle size={14} color={colors.primaryForeground} />
						) : undefined
					}
					style={{ marginTop: spacing.md }}
				/>
			</Card>
			<Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>
				Информация
			</Text>
			<Card style={styles.section}>
				<View style={styles.infoRow}>
					<Info size={14} color={colors.mutedForeground} />
					<Text style={styles.infoLabel}>Версия</Text>
					<Text style={styles.infoValue}>{appVersion}</Text>
				</View>
				<View style={styles.infoRow}>
					<Info size={14} color={colors.mutedForeground} />
					<Text style={styles.infoLabel}>Платформа</Text>
					<Text style={styles.infoValue}>
						{Platform.OS} {Platform.Version}
					</Text>
				</View>
				<View style={styles.infoRow}>
					<Server size={14} color={colors.mutedForeground} />
					<Text style={styles.infoLabel}>Backend</Text>
					<Text style={styles.infoValue} numberOfLines={1}>
						{apiUrl}
					</Text>
				</View>
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
	section: { gap: spacing.sm },
	serverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
	serverLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
	},
	inputWrap: { marginTop: spacing.sm },
	warningRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		marginTop: spacing.xs,
	},
	warningText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.statusPending,
	},
	infoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.sm,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.separator,
	},
	infoLabel: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
		flex: 1,
	},
	infoValue: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.foreground,
		maxWidth: '60%',
	},
})
