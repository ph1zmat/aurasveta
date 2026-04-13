import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuth } from '../lib/auth'

export function MoreScreen() {
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>АККАУНТ</Text>
        <Text style={styles.infoText}>{user?.email}</Text>
        <Text style={styles.infoSubtext}>Роль: {user?.role}</Text>
      </View>

      {/* Menu items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>УПРАВЛЕНИЕ</Text>
        <MenuItem label="Свойства" />
        <MenuItem label="Страницы CMS" />
        <MenuItem label="Вебхуки" />
        <MenuItem label="Импорт / Экспорт" />
        <MenuItem label="SEO настройки" />
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Выйти</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Аура Света CMS Mobile v1.0.0</Text>
    </View>
  )
}

function MenuItem({ label }: { label: string }) {
  return (
    <TouchableOpacity style={styles.menuItem}>
      <Text style={styles.menuItemText}>{label}</Text>
      <Text style={styles.menuArrow}>→</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 16 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 2, color: '#999', marginBottom: 12 },
  infoText: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  infoSubtext: { fontSize: 13, color: '#666' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  menuItemText: { fontSize: 15 },
  menuArrow: { fontSize: 14, color: '#ccc' },
  logoutBtn: {
    backgroundColor: '#fee2e2', borderRadius: 12, paddingVertical: 14, alignItems: 'center',
  },
  logoutText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
  version: { textAlign: 'center', color: '#ccc', fontSize: 12, marginTop: 24 },
})
