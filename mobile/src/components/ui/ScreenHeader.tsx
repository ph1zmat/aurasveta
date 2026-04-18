import { View, Text, StyleSheet, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { ArrowLeft } from 'lucide-react-native'
import { IconButton } from './IconButton'
import { colors, fontSize, fontWeight, fontFamily, spacing } from '../../theme'

type Props = {
	title: string
	icon: React.ReactNode
	showBack?: boolean
	right?: React.ReactNode
}

export function ScreenHeader({ title, icon, showBack, right }: Props) {
	const navigation = useNavigation()

	return (
		<View style={styles.header}>
			<View style={styles.headerLeft}>
				{showBack && (
					<IconButton
						icon={<ArrowLeft size={20} color={colors.foreground} />}
						onPress={() => navigation.goBack()}
						accessibilityLabel='Назад'
						size='lg'
						variant='ghost'
						style={{ marginRight: -4 }}
					/>
				)}
				{icon}
				<Text style={styles.headerTitle}>{title}</Text>
			</View>
			{right && <View style={styles.headerRight}>{right}</View>}
		</View>
	)
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
	},
	headerLeft: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		flex: 1,
	},
	headerRight: {
		flexShrink: 0,
	},
	headerTitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize['2xl'],
		fontWeight: fontWeight.bold,
		color: colors.foreground,
		letterSpacing: 0.2,
	},
})
