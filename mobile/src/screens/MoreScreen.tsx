import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuth } from '../lib/auth'
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../theme'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { SlidersHorizontal, FileText, Webhook, FolderInput, Search, Settings, LogOut, ChevronRight, User } from 'lucide-react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MoreStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>

const menuItems: { label: string; icon: any; route: keyof MoreStackParamList; color: string }[] = [
  { label: 'Свойства', icon: SlidersHorizontal, route: 'Properties', color: colors.statusPaid },
  { label: 'Страницы CMS', icon: FileText, route: 'Pages', color: colors.statusShipped },
  { label: 'Вебхуки', icon: Webhook, route: 'Webhooks', color: colors.statusPending },
  { label: 'Импорт / Экспорт', icon: FolderInput, route: 'ImportExport', color: colors.statusDelivered },
  { label: 'SEO настройки', icon: Search, route: 'Seo', color: '#EC4899' },
  { label: 'Настройки', icon: Settings, route: 'Settings', color: colors.mutedForeground },
]

export function MoreScreen({ navigation }: Props) {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    Alert.alert('Выход', 'Выйти из аккаунта?', [
      { text: 'Отмена' },
      { text: 'Выйти', style: 'destructive', onPress: () => logout() },
    ])
  }

  return (
    <View style={styles.container}>
      {/* User info */}
      <Card style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <User size={22} color={colors.primaryForeground} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user?.name || user?.email}</Text>
          <Badge
            label={user?.role ?? 'USER'}
            color={user?.role === 'ADMIN' ? colors.primary : colors.mutedForeground}
            bg={user?.role === 'ADMIN' ? colors.primary + '20' : colors.muted}
            style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
          />
        </View>
      </Card>

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>УПРАВЛЕНИЕ</Text>
        {menuItems.map(item => {
          const Icon = item.icon
          return (
            <TouchableOpacity key={item.route} style={styles.menuItem} onPress={() => navigation.navigate(item.route as any)}>
              <View style={[styles.menuIconBox, { backgroundColor: item.color + '1A' }]}>
                <Icon size={16} color={item.color} />
              </View>
              <Text style={styles.menuItemText}>{item.label}</Text>
              <ChevronRight size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.section}>
        <Button title="Выйти" variant="destructive" onPress={handleLogout} icon={<LogOut size={16} color={colors.destructiveForeground} />} />
      </View>

      <Text style={styles.version}>Аура Света CMS Mobile v1.0.0</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.lg },
  userCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  userName: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.foreground },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.xl },
  sectionTitle: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, letterSpacing: 2, color: colors.mutedForeground, marginBottom: spacing.md },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    backgroundColor: colors.card, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  menuIconBox: { width: 32, height: 32, borderRadius: borderRadius.sm, justifyContent: 'center', alignItems: 'center' },
  menuItemText: { flex: 1, fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.foreground },
  version: { textAlign: 'center', fontSize: fontSize.xs, color: colors.mutedForeground, marginTop: spacing.sm },
})
