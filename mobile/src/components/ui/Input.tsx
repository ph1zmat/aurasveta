import {
	View,
	Text,
	TextInput,
	StyleSheet,
	type StyleProp,
	type TextInputProps,
	type ViewStyle,
} from 'react-native'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	borderRadius,
	spacing,
} from '../../theme'

interface InputProps extends TextInputProps {
	label?: string
	error?: string
	containerStyle?: StyleProp<ViewStyle>
}

export function Input({
	label,
	error,
	containerStyle,
	style,
	...props
}: InputProps) {
	return (
		<View style={containerStyle}>
			{label ? <Text style={styles.label}>{label}</Text> : null}
			<TextInput
				placeholderTextColor={colors.mutedForeground}
				style={[styles.input, error ? styles.inputError : null, style]}
				{...props}
			/>
			{error ? <Text style={styles.error}>{error}</Text> : null}
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
	input: {
		height: 48,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: borderRadius.md,
		paddingHorizontal: spacing.lg,
		fontSize: fontSize.base,
		fontFamily: fontFamily.base,
		backgroundColor: colors.card,
		color: colors.foreground,
	},
	inputError: {
		borderColor: colors.destructive,
	},
	error: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.xs,
		color: colors.destructive,
		marginTop: spacing.xs,
	},
})
