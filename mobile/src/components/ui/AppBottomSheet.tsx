import { useCallback, useMemo, useRef, type ReactNode } from 'react'
import {
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	View,
	Text,
	Pressable,
} from 'react-native'
import BottomSheet, {
	BottomSheetBackdrop,
	BottomSheetScrollView,
	type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
	elevation,
} from '../../theme'

interface AppBottomSheetProps {
	/** Ref для управления извне */
	sheetRef?: React.RefObject<BottomSheet | null>
	/** Snap points в процентах или пикселях (default: ['50%', '85%']) */
	snapPoints?: (string | number)[]
	/** Заголовок sheet */
	title?: string
	/** Содержимое */
	children: ReactNode
	/** Callback при закрытии */
	onClose?: () => void
	/** Включить поддержку клавиатуры (для форм/фильтров) */
	keyboardAware?: boolean
	/** Начальный snap index (-1 = скрыт) */
	index?: number
}

/**
 * Обёртка @gorhom/bottom-sheet с темой приложения.
 *
 * Применение:
 * - Фильтры заказов (заменяет модальные окна)
 * - Выбор статуса, детали заказа (one-hand navigation)
 * - Формы редактирования (с keyboardAware)
 *
 * @example
 * const sheetRef = useRef<BottomSheet>(null)
 *
 * <AppBottomSheet
 *   sheetRef={sheetRef}
 *   title="Фильтры"
 *   snapPoints={['40%', '80%']}
 *   keyboardAware
 * >
 *   <FilterForm />
 * </AppBottomSheet>
 *
 * // Открытие:
 * sheetRef.current?.snapToIndex(0)
 */
export function AppBottomSheet({
	sheetRef,
	snapPoints: snapPointsProp,
	title,
	children,
	onClose,
	keyboardAware = false,
	index = -1,
}: AppBottomSheetProps) {
	const internalRef = useRef<BottomSheet>(null)
	const ref = sheetRef ?? internalRef
	const snapPoints = useMemo(
		() => snapPointsProp ?? ['50%', '85%'],
		[snapPointsProp],
	)

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop
				{...props}
				disappearsOnIndex={-1}
				appearsOnIndex={0}
				opacity={0.5}
				pressBehavior='close'
			/>
		),
		[],
	)

	const handleClose = useCallback(() => {
		onClose?.()
	}, [onClose])

	const content = (
		<BottomSheet
			ref={ref}
			index={index}
			snapPoints={snapPoints}
			enablePanDownToClose
			onClose={handleClose}
			backdropComponent={renderBackdrop}
			backgroundStyle={styles.background}
			handleIndicatorStyle={styles.handle}
			keyboardBehavior={keyboardAware ? 'interactive' : 'extend'}
			keyboardBlurBehavior='restore'
			android_keyboardInputMode='adjustResize'
		>
			{title ? (
				<View style={styles.header}>
					<Text style={styles.title}>{title}</Text>
				</View>
			) : null}
			<BottomSheetScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps='handled'
				showsVerticalScrollIndicator={false}
			>
				{children}
			</BottomSheetScrollView>
		</BottomSheet>
	)

	if (keyboardAware && Platform.OS === 'ios') {
		return (
			<KeyboardAvoidingView
				behavior='padding'
				style={StyleSheet.absoluteFill}
				pointerEvents='box-none'
			>
				{content}
			</KeyboardAvoidingView>
		)
	}

	return content
}

const styles = StyleSheet.create({
	background: {
		backgroundColor: colors.card,
		borderTopLeftRadius: borderRadius.lg,
		borderTopRightRadius: borderRadius.lg,
		...elevation(4),
	},
	handle: {
		backgroundColor: colors.border,
		width: 40,
		height: 4,
		borderRadius: 2,
	},
	header: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.separator,
	},
	title: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.lg,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
	},
	content: {
		padding: spacing.lg,
	},
})
