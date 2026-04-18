import { Platform, type ViewStyle } from 'react-native'
import { colors } from './colors'

/**
 * Material Design 3 elevation system.
 * Android uses native `elevation` prop; iOS uses shadow* properties.
 *
 * Levels follow MD3 spec:
 *   0 = flat, 1 = card, 2 = raised card, 3 = modal/FAB, 4 = navigation drawer, 5 = dialog
 */
type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5

const iosShadows: Record<ElevationLevel, ViewStyle> = {
	0: {},
	1: {
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
	},
	2: {
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.08,
		shadowRadius: 4,
	},
	3: {
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 8,
	},
	4: {
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
	},
	5: {
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.18,
		shadowRadius: 16,
	},
}

export function elevation(level: ElevationLevel): ViewStyle {
	if (Platform.OS === 'android') {
		return { elevation: level * 2 }
	}
	return iosShadows[level]
}
