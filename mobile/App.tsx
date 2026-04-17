import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/lib/auth'
import { TRPCProvider } from './src/lib/trpc'
import { RootNavigator } from './src/navigation/RootNavigator'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F5F0E8',
  },
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </TRPCProvider>
    </QueryClientProvider>
  )
}
