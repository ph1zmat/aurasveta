import { useState } from 'react'
import {
	View,
	Text,
	Pressable,
	Image,
	StyleSheet,
	Alert,
	ActivityIndicator,
	Platform,
} from 'react-native'
import * as ExpoImagePicker from 'expo-image-picker'
import { ImagePlus } from 'lucide-react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
	ripple,
} from '../../theme'
import { getToken, getApiUrl } from '../../lib/store'

interface ImagePickerProps {
	imageUrl: string | null
	onImageUploaded: (path: string) => void
	onImageRemoved?: () => void
	height?: number
}

export function ImagePicker({
	imageUrl,
	onImageUploaded,
	onImageRemoved,
	height = 160,
}: ImagePickerProps) {
	const [uploading, setUploading] = useState(false)

	const pickImage = async () => {
		const result = await ExpoImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			allowsEditing: true,
			quality: 0.8,
		})

		if (result.canceled || !result.assets[0]) return

		setUploading(true)
		try {
			const asset = result.assets[0]
			const apiUrl = await getApiUrl()
			const token = await getToken()

			const formData = new FormData()
			formData.append('file', {
				uri: asset.uri,
				name: asset.fileName || 'image.jpg',
				type: asset.mimeType || 'image/jpeg',
			} as any)

			const res = await fetch(`${apiUrl}/api/upload`, {
				method: 'POST',
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: formData,
			})

			if (!res.ok) throw new Error('Ошибка загрузки')
			const data = await res.json()
			onImageUploaded(data.path)
		} catch (err) {
			Alert.alert(
				'Ошибка',
				err instanceof Error ? err.message : 'Не удалось загрузить изображение',
			)
		} finally {
			setUploading(false)
		}
	}

	const apiUrlSync = 'https://aurasveta.ru' // fallback for display
	const fullUrl = imageUrl?.startsWith('http')
		? imageUrl
		: imageUrl
			? `${apiUrlSync}${imageUrl}`
			: null

	if (!fullUrl) {
		return (
			<Pressable
				android_ripple={ripple.ghost}
				style={({ pressed }) => [
					styles.container,
					{ height },
					Platform.OS !== 'android' && pressed ? { opacity: 0.7 } : undefined,
				]}
				onPress={pickImage}
			>
				{uploading ? (
					<ActivityIndicator color={colors.primary} />
				) : (
					<View style={styles.placeholder}>
						<ImagePlus size={28} color={colors.mutedForeground} />
						<Text style={styles.placeholderText}>Нажмите для загрузки</Text>
					</View>
				)}
			</Pressable>
		)
	}

	return (
		<View style={[styles.container, { height }]}>
			<Image
				source={{ uri: fullUrl }}
				style={styles.image}
				resizeMode='cover'
			/>
			<View style={styles.actions}>
				{uploading ? (
					<ActivityIndicator color={colors.white} />
				) : (
					<>
						<Pressable
							android_ripple={ripple.ghost}
							style={[
								styles.actionBtn,
								Platform.OS === 'android' ? { overflow: 'hidden' } : undefined,
							]}
							onPress={pickImage}
						>
							<Text style={styles.actionText}>Заменить</Text>
						</Pressable>
						{onImageRemoved ? (
							<Pressable
								android_ripple={ripple.destructive}
								style={[
									styles.actionBtn,
									styles.removeBtn,
									Platform.OS === 'android'
										? { overflow: 'hidden' }
										: undefined,
								]}
								onPress={onImageRemoved}
							>
								<Text style={styles.actionText}>Удалить</Text>
							</Pressable>
						) : null}
					</>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		borderRadius: borderRadius.md,
		borderWidth: 1,
		borderColor: colors.border,
		overflow: 'hidden',
		backgroundColor: colors.muted,
		position: 'relative',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	placeholder: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	placeholderText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		color: colors.mutedForeground,
	},
	actions: {
		flexDirection: 'row',
		gap: spacing.sm,
		position: 'absolute',
		bottom: spacing.sm,
		right: spacing.sm,
	},
	actionBtn: {
		backgroundColor: colors.primary,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: borderRadius.sm,
	},
	removeBtn: {
		backgroundColor: colors.destructive,
	},
	actionText: {
		fontFamily: fontFamily.base,
		color: colors.white,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
	},
})
