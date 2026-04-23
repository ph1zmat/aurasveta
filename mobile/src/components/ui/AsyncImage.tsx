import { useMemo, useState } from 'react'
import {
	ActivityIndicator,
	Image,
	StyleSheet,
	type ImageResizeMode,
	type ImageStyle,
	type LayoutChangeEvent,
	type StyleProp,
	type ViewStyle,
	View,
} from 'react-native'
import { ImageOff } from 'lucide-react-native'
import { colors } from '../../theme'
import { Skeleton } from './Skeleton'

interface AsyncImageProps {
	uri?: string | null
	containerStyle?: StyleProp<ViewStyle>
	imageStyle?: StyleProp<ImageStyle>
	resizeMode?: ImageResizeMode
	fallback?: React.ReactNode
	showSpinner?: boolean
}

export function AsyncImage({
	uri,
	containerStyle,
	imageStyle,
	resizeMode = 'cover',
	fallback,
	showSpinner = true,
}: AsyncImageProps) {
	const [isLoaded, setIsLoaded] = useState(false)
	const [hasError, setHasError] = useState(false)
	const [height, setHeight] = useState(0)
	const normalizedUri = useMemo(() => uri?.trim() ?? '', [uri])

	const handleLayout = (event: LayoutChangeEvent) => {
		setHeight(event.nativeEvent.layout.height)
	}

	return (
		<View style={[styles.container, containerStyle]} onLayout={handleLayout}>
			{normalizedUri && !hasError ? (
				<Image
					source={{ uri: normalizedUri }}
					style={[styles.image, imageStyle, !isLoaded && styles.hidden]}
					resizeMode={resizeMode}
					onLoad={() => setIsLoaded(true)}
					onError={() => {
						setHasError(true)
						setIsLoaded(false)
					}}
				/>
			) : null}

			{!isLoaded && !hasError && normalizedUri ? (
				<View style={styles.overlay} pointerEvents='none'>
					<Skeleton width='100%' height={Math.max(height, 1)} style={styles.skeleton} />
					{showSpinner ? (
						<ActivityIndicator color={colors.primary} style={styles.spinner} />
					) : null}
				</View>
			) : null}

			{(!normalizedUri || hasError) &&
				(fallback ?? (
					<View style={styles.fallback}>
						<ImageOff size={20} color={colors.mutedForeground} />
					</View>
				))}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		overflow: 'hidden',
	},
	image: {
		width: '100%',
		height: '100%',
	},
	hidden: {
		opacity: 0,
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: 'center',
		alignItems: 'center',
	},
	skeleton: {
		...StyleSheet.absoluteFillObject,
	},
	spinner: {
		position: 'absolute',
	},
	fallback: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.muted,
		justifyContent: 'center',
		alignItems: 'center',
	},
})