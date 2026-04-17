import { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal as RNModal } from 'react-native'
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../theme'

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
}

export function Select({ label, options, value, onValueChange, placeholder = 'Выберите...' }: SelectProps) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.value === value)

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected?.label ?? placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <RNModal visible={open} transparent animationType="fade" statusBarTranslucent>
        <TouchableOpacity style={styles.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={styles.dropdown}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => { onValueChange(''); setOpen(false) }}
              >
                <Text style={[styles.optionText, styles.placeholder]}>{placeholder}</Text>
              </TouchableOpacity>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.option, opt.value === value && styles.optionActive]}
                  onPress={() => { onValueChange(opt.value); setOpen(false) }}
                >
                  <Text style={[styles.optionText, opt.value === value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </RNModal>
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.mutedForeground,
    marginBottom: spacing.xs,
  },
  trigger: {
    height: 44,
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: spacing['2xl'],
  },
  dropdown: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
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
    backgroundColor: colors.primary + '20',
  },
  optionText: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
})
