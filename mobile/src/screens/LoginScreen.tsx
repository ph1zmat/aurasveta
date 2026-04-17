import { useState } from 'react'
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useAuth } from '../lib/auth'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Sparkles, LogIn } from 'lucide-react-native'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setEmailError('')
    if (!email || !password) { Alert.alert('Ошибка', 'Заполните все поля'); return }
    if (!EMAIL_RE.test(email)) { setEmailError('Некорректный email'); return }
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoBox}>
          <View style={styles.logoCircle}>
            <Sparkles size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>АУРА СВЕТА</Text>
          <Text style={styles.subtitle}>Панель управления</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={(v) => { setEmail(v); setEmailError('') }}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="admin@example.com"
            error={emailError}
            containerStyle={styles.field}
          />
          <Input
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            containerStyle={styles.field}
          />

          <Button
            title={loading ? 'Вход...' : 'Войти'}
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: spacing.md }}
            icon={!loading ? <LogIn size={16} color={colors.primaryForeground} /> : undefined}
          />
        </View>

        <Text style={styles.version}>v1.0.0</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, backgroundColor: colors.background },
  logoBox: { alignItems: 'center', marginBottom: spacing['3xl'] },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.primary + '1A',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, letterSpacing: 4, color: colors.foreground },
  subtitle: { fontSize: fontSize.sm, color: colors.mutedForeground, marginTop: spacing.xs },
  form: {
    backgroundColor: colors.card, borderRadius: borderRadius.xl,
    padding: spacing.xl, borderWidth: 1, borderColor: colors.border,
  },
  field: { marginBottom: spacing.md },
  version: { textAlign: 'center', fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: spacing['2xl'] },
})
