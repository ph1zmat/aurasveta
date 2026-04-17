import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator, type ViewStyle, type TextStyle } from 'react-native'
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../theme'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  textStyle?: TextStyle
  icon?: ReactNode
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: colors.primaryForeground },
  secondary: { bg: colors.secondary, text: colors.secondaryForeground },
  ghost: { bg: colors.transparent, text: colors.foreground },
  destructive: { bg: colors.destructive, text: colors.destructiveForeground },
}

const sizeStyles: Record<Size, { height: number; px: number; fs: number }> = {
  sm: { height: 32, px: spacing.md, fs: fontSize.sm },
  md: { height: 40, px: spacing.lg, fs: fontSize.base },
  lg: { height: 48, px: spacing.xl, fs: fontSize.lg },
}

export function Button({ title, onPress, variant = 'primary', size = 'md', disabled, loading, style, textStyle, icon }: ButtonProps) {
  const v = variantStyles[variant]
  const s = sizeStyles[size]

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          height: s.height,
          paddingHorizontal: s.px,
          borderColor: v.border || colors.transparent,
          borderWidth: v.border ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <View style={styles.content}>
          {icon}
          {title ? <Text style={[styles.text, { color: v.text, fontSize: s.fs }, icon ? { marginLeft: 6 } : undefined, textStyle]}>{title}</Text> : null}
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: fontWeight.semibold,
  },
})
