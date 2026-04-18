import { Platform, PixelRatio } from 'react-native'

/**
 * Scale-independent font sizing for Android.
 *
 * On Android, system font-size scale can make text overflow.
 * This util caps the scaling factor to `maxScale` (default 1.2)
 * so that UI stays usable with accessibility font sizes while
 * not breaking layouts.
 *
 * Usage:
 *   fontSize: scaledFontSize(14)
 */
const MAX_FONT_SCALE = 1.2

export function scaledFontSize(size: number): number {
	if (Platform.OS !== 'android') return size
	const scale = PixelRatio.getFontScale()
	const clampedScale = Math.min(scale, MAX_FONT_SCALE)
	return Math.round(size * clampedScale)
}

/**
 * Line height that maintains consistent vertical rhythm.
 * Ratio: 1.5× for body text, 1.3× for headings.
 */
export function lineHeight(fontSize: number, heading = false): number {
	return Math.round(fontSize * (heading ? 1.3 : 1.5))
}
