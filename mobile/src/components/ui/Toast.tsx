import {
	createContext,
	useCallback,
	useContext,
	useRef,
	useState,
	type ReactNode,
} from 'react'
import { Animated, Text, StyleSheet, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
	elevation,
} from '../../theme'

type ToastType = 'success' | 'error' | 'info'

interface ToastData {
	message: string
	type: ToastType
}

interface ToastContextValue {
	showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} })

export function useToast() {
	return useContext(ToastContext)
}

const TYPE_COLORS: Record<ToastType, { bg: string; text: string }> = {
	success: { bg: colors.statusDeliveredBg, text: colors.statusDelivered },
	error: { bg: '#FEE2E2', text: colors.destructive },
	info: { bg: colors.statusPaidBg, text: colors.statusPaid },
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const insets = useSafeAreaInsets()
	const [toast, setToast] = useState<ToastData | null>(null)
	const translateY = useRef(new Animated.Value(-100)).current
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>()

	const showToast = useCallback(
		(message: string, type: ToastType = 'info') => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current)

			setToast({ message, type })
			translateY.setValue(-100)

			Animated.spring(translateY, {
				toValue: 0,
				useNativeDriver: true,
				friction: 8,
				tension: 60,
			}).start()

			timeoutRef.current = setTimeout(() => {
				Animated.timing(translateY, {
					toValue: -100,
					duration: 250,
					useNativeDriver: true,
				}).start(() => setToast(null))
			}, 3000)
		},
		[translateY],
	)

	const typeColors = toast ? TYPE_COLORS[toast.type] : TYPE_COLORS.info

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{toast && (
				<Animated.View
					style={[
						styles.toast,
						elevation(3),
						{
							top: insets.top + spacing.sm,
							backgroundColor: typeColors.bg,
							transform: [{ translateY }],
						},
					]}
					pointerEvents='none'
				>
					<Text
						style={[styles.text, { color: typeColors.text }]}
						numberOfLines={2}
					>
						{toast.message}
					</Text>
				</Animated.View>
			)}
		</ToastContext.Provider>
	)
}

const styles = StyleSheet.create({
	toast: {
		position: 'absolute',
		left: spacing.lg,
		right: spacing.lg,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		zIndex: 9999,
	},
	text: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		textAlign: 'center',
	},
})
