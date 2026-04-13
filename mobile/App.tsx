import { NavigationContainer } from '@react-navigation/native'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/lib/auth'
import { TRPCProvider } from './src/lib/trpc'
import { RootNavigator } from './src/navigation/RootNavigator'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider>
        <AuthProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </TRPCProvider>
    </QueryClientProvider>
  )
}
