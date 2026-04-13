import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../lib/auth'
import { LoginScreen } from '../screens/LoginScreen'
import { AdminTabNavigator } from './AdminTabNavigator'
import { ActivityIndicator, View } from 'react-native'

const Stack = createNativeStackNavigator()

export function RootNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
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
