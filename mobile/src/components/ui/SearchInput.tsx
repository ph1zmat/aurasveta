import { useState, useEffect } from 'react'
import { View, TextInput, StyleSheet } from 'react-native'
import {
	colors,
	fontSize,
	fontFamily,
	borderRadius,
	spacing,
} from '../../theme'
import { Search } from 'lucide-react-native'

interface SearchInputProps {
	value: string
	onChangeText: (text: string) => void
	placeholder?: string
	debounceMs?: number
}

export function SearchInput({
	value,
	onChangeText,
	placeholder = 'Поиск...',
	debounceMs = 300,
}: SearchInputProps) {
	const [local, setLocal] = useState(value)

	useEffect(() => {
		setLocal(value)
	}, [value])

	useEffect(() => {
		const timer = setTimeout(() => {
			if (local !== value) onChangeText(local)
		}, debounceMs)
		return () => clearTimeout(timer)
	}, [local, debounceMs])

	return (
		<View style={styles.container}>
			<Search size={16} color={colors.mutedForeground} style={styles.icon} />
			<TextInput
				style={styles.input}
				placeholder={placeholder}
				placeholderTextColor={colors.mutedForeground}
				value={local}
				onChangeText={setLocal}
				returnKeyType='search'
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 48,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: borderRadius.md,
		marginHorizontal: spacing.md,
		marginVertical: spacing.md,
		backgroundColor: colors.card,
		paddingHorizontal: spacing.md,
	},
	icon: {
		marginRight: spacing.sm,
	},
	input: {
		flex: 1,
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		color: colors.foreground,
		padding: 0,
	},
})
