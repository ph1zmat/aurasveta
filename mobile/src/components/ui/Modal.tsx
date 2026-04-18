import {
	Modal as RNModal,
	View,
	Text,
	Pressable,
	ScrollView,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	type ReactNode,
} from 'react-native'
import { X } from 'lucide-react-native'
import { IconButton } from './IconButton'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
} from '../../theme'

interface ModalProps {
	visible: boolean
	onClose: () => void
	title?: string
	children: ReactNode
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
	return (
		<RNModal
			visible={visible}
			animationType='slide'
			transparent
			statusBarTranslucent
		>
			<KeyboardAvoidingView
				style={styles.overlay}
				behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			>
				<View style={styles.backdrop}>
					<Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
				</View>
				<View style={styles.container}>
					<View style={styles.handle} />
					{title ? (
						<View style={styles.header}>
							<Text style={styles.title}>{title}</Text>
							<IconButton
								icon={<X size={16} color={colors.mutedForeground} />}
								onPress={onClose}
								accessibilityLabel='Закрыть'
								size='sm'
							/>
						</View>
					) : null}
					<ScrollView
						style={styles.body}
						contentContainerStyle={styles.bodyContent}
						keyboardShouldPersistTaps='handled'
						showsVerticalScrollIndicator={false}
					>
						{children}
					</ScrollView>
				</View>
			</KeyboardAvoidingView>
		</RNModal>
	)
}

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: colors.overlayDark,
	},
	container: {
		backgroundColor: colors.card,
		borderTopLeftRadius: borderRadius.lg,
		borderTopRightRadius: borderRadius.lg,
		maxHeight: '92%',
		paddingBottom: spacing.xl,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: colors.border,
		borderRadius: 2,
		alignSelf: 'center',
		marginTop: spacing.sm,
		marginBottom: spacing.xs,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	title: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.lg,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
	},
	body: {
		flexGrow: 0,
	},
	bodyContent: {
		padding: spacing.lg,
	},
})
