import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { StatusBar } from 'expo-status-bar'
import * as NavigationBar from 'expo-navigation-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useFonts } from 'expo-font'
import { useCallback, useEffect } from 'react'
import { Platform, View } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/lib/auth'
import { TRPCProvider } from './src/lib/trpc'
import { ToastProvider } from './src/components/ui/Toast'
import { RootNavigator } from './src/navigation/RootNavigator'

SplashScreen.preventAutoHideAsync()

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
			// Не показываем экран загрузки при возврате на экран
			refetchOnMount: 'always',
			// Данные остаются свежими при переключении вкладок
			refetchOnWindowFocus: false,
		},
	},
})

const navTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: '#F5F0E8',
	},
}

export default function App() {
	const [fontsLoaded] = useFonts({
		ChironGoRoundTC: require('./assets/fonts/ChironGoRoundTC-Regular.ttf'),
	})

	useEffect(() => {
		if (Platform.OS === 'android') {
			NavigationBar.setBackgroundColorAsync('transparent').catch(() => {})
			NavigationBar.setButtonStyleAsync('dark').catch(() => {})
			NavigationBar.setPositionAsync('absolute').catch(() => {})
		}
	}, [])

	const onLayoutRootView = useCallback(async () => {
		if (fontsLoaded) {
			await SplashScreen.hideAsync()
		}
	}, [fontsLoaded])

	if (!fontsLoaded) return null

	return (
		<SafeAreaProvider>
			<View style={{ flex: 1 }} onLayout={onLayoutRootView}>
				<QueryClientProvider client={queryClient}>
					<TRPCProvider>
						<AuthProvider>
							<NavigationContainer theme={navTheme}>
								<ToastProvider>
									<StatusBar style='dark' translucent />
									<RootNavigator />
								</ToastProvider>
							</NavigationContainer>
						</AuthProvider>
					</TRPCProvider>
				</QueryClientProvider>
			</View>
		</SafeAreaProvider>
	)
}
