import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../lib/auth'
import { LoginScreen } from '../screens/LoginScreen'
import { AdminTabNavigator } from './AdminTabNavigator'
import { ActivityIndicator, View, Text } from 'react-native'
import { colors } from '../theme'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.foreground }}>Загрузка...</Text>
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Admin" component={AdminTabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}
