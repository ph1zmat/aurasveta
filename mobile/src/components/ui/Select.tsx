import { useState } from 'react'
import {
	View,
	Text,
	Pressable,
	ScrollView,
	StyleSheet,
	Modal as RNModal,
	Platform,
	type ViewStyle,
} from 'react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
	ripple,
} from '../../theme'

interface SelectOption {
	label: string
	value: string
}

interface SelectProps {
	label?: string
	options: SelectOption[]
	value: string
	onValueChange: (value: string) => void
	placeholder?: string
	containerStyle?: ViewStyle
}

export function Select({
	label,
	options,
	value,
	onValueChange,
	placeholder = 'Выберите...',
	containerStyle,
}: SelectProps) {
	const [open, setOpen] = useState(false)
	const selected = options.find(o => o.value === value)

	return (
		<View style={containerStyle}>
			{label ? <Text style={styles.label}>{label}</Text> : null}
			<Pressable
				android_ripple={ripple.ghost}
				style={({ pressed }) => [
					styles.trigger,
					Platform.OS === 'android'
						? { overflow: 'hidden' }
						: pressed
							? { opacity: 0.7 }
							: undefined,
				]}
				onPress={() => setOpen(true)}
			>
				<Text style={[styles.triggerText, !selected && styles.placeholder]}>
					{selected?.label ?? placeholder}
				</Text>
				<Text style={styles.arrow}>▼</Text>
			</Pressable>

			<RNModal
				visible={open}
				transparent
				animationType='fade'
				statusBarTranslucent
			>
				<Pressable style={styles.overlay} onPress={() => setOpen(false)}>
					<View style={styles.dropdown}>
						<ScrollView
							style={styles.scroll}
							showsVerticalScrollIndicator={false}
						>
							<Pressable
								android_ripple={ripple.ghost}
								style={({ pressed }) => [
									styles.option,
									Platform.OS !== 'android' && pressed
										? { opacity: 0.7 }
										: undefined,
								]}
								onPress={() => {
									onValueChange('')
									setOpen(false)
								}}
							>
								<Text style={[styles.optionText, styles.placeholder]}>
									{placeholder}
								</Text>
							</Pressable>
							{options.map(opt => (
								<Pressable
									key={opt.value}
									android_ripple={ripple.ghost}
									style={({ pressed }) => [
										styles.option,
										opt.value === value && styles.optionActive,
										Platform.OS !== 'android' && pressed
											? { opacity: 0.7 }
											: undefined,
									]}
									onPress={() => {
										onValueChange(opt.value)
										setOpen(false)
									}}
								>
									<Text
										style={[
											styles.optionText,
											opt.value === value && styles.optionTextActive,
										]}
									>
										{opt.label}
									</Text>
								</Pressable>
							))}
						</ScrollView>
					</View>
				</Pressable>
			</RNModal>
		</View>
	)
}

const styles = StyleSheet.create({
	label: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
		marginBottom: spacing.xs,
	},
	trigger: {
		height: 48,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.lg,
		backgroundColor: colors.card,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	triggerText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		color: colors.foreground,
		flex: 1,
	},
	placeholder: {
		color: colors.mutedForeground,
	},
	arrow: {
		fontSize: fontSize.xs,
		color: colors.mutedForeground,
	},
	overlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: colors.overlayMedium,
		padding: spacing['2xl'],
	},
	dropdown: {
		backgroundColor: colors.card,
		borderRadius: borderRadius.md,
		width: '100%',
		maxHeight: 400,
		borderWidth: 1,
		borderColor: colors.border,
	},
	scroll: {
		padding: spacing.sm,
	},
	option: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderRadius: borderRadius.sm,
	},
	optionActive: {
		backgroundColor: colors.primary + '18',
	},
	optionText: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		color: colors.foreground,
	},
	optionTextActive: {
		color: colors.primary,
		fontWeight: fontWeight.semibold,
	},
})
