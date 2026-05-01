import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ProductsScreen } from '../screens/ProductsScreen'
import { ProductFormScreen } from '../screens/ProductFormScreen'
import { OrdersScreen } from '../screens/OrdersScreen'
import { OrderDetailScreen } from '../screens/OrderDetailScreen'
import { CategoriesScreen } from '../screens/CategoriesScreen'
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen'
import { CategoryFormScreen } from '../screens/CategoryFormScreen'
import { MoreScreen } from '../screens/MoreScreen'
import { PropertiesScreen } from '../screens/PropertiesScreen'
import { PagesScreen } from '../screens/PagesScreen'
import { PageFormScreen } from '../screens/PageFormScreen'
import { SeoScreen } from '../screens/SeoScreen'
import { WebhooksScreen } from '../screens/WebhooksScreen'
import { ImportExportScreen } from '../screens/ImportExportScreen'
import { SettingsScreen } from '../screens/SettingsScreen'
import { NavigationScreen } from '../screens/NavigationScreen'
import { Platform, View, StyleSheet } from 'react-native'
import { colors, fontFamily, elevation, borderRadius } from '../theme'
import {
	LayoutDashboard,
	Package,
	ShoppingCart,
	FolderOpen,
	Menu,
} from 'lucide-react-native'
import type {
	ProductsStackParamList,
	OrdersStackParamList,
	CategoriesStackParamList,
	MoreStackParamList,
} from './types'

const Tab = createBottomTabNavigator()

/**
 * Unified stack header style — clean, warm, no shadow by default.
 * FontFamily applied via headerTitleStyle.
 */
const screenOptions = {
	headerStyle: {
		backgroundColor: colors.card,
		...Platform.select({
			android: { elevation: 0 },
			ios: { shadowOpacity: 0 },
		}),
	},
	headerTintColor: colors.foreground,
	headerTitleStyle: {
		fontFamily: fontFamily.base,
		fontSize: 18,
		fontWeight: '600' as const,
		letterSpacing: 0.2,
	},
	headerBackTitleVisible: false,
	headerShadowVisible: false,
	...(Platform.OS === 'android'
		? { animation: 'slide_from_right' as const }
		: {}),
}

// --- Products Stack ---
const ProductsStack = createNativeStackNavigator<ProductsStackParamList>()
function ProductsStackScreen() {
	return (
		<ProductsStack.Navigator screenOptions={screenOptions}>
			<ProductsStack.Screen
				name='ProductsList'
				component={ProductsScreen}
				options={{ headerShown: false }}
			/>
			<ProductsStack.Screen
				name='ProductForm'
				component={ProductFormScreen}
				options={({ route }) => ({
					title: route.params?.id ? 'Редактирование' : 'Новый товар',
				})}
			/>
		</ProductsStack.Navigator>
	)
}

// --- Orders Stack ---
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>()
function OrdersStackScreen() {
	return (
		<OrdersStack.Navigator screenOptions={screenOptions}>
			<OrdersStack.Screen
				name='OrdersList'
				component={OrdersScreen}
				options={{ headerShown: false }}
			/>
			<OrdersStack.Screen
				name='OrderDetail'
				component={OrderDetailScreen}
				options={{ title: 'Заказ' }}
			/>
		</OrdersStack.Navigator>
	)
}

// --- Categories Stack ---
const CategoriesStack = createNativeStackNavigator<CategoriesStackParamList>()
function CategoriesStackScreen() {
	return (
		<CategoriesStack.Navigator screenOptions={screenOptions}>
			<CategoriesStack.Screen
				name='CategoriesList'
				component={CategoriesScreen}
				options={{ headerShown: false }}
			/>
			<CategoriesStack.Screen
				name='CategoryDetail'
				component={CategoryDetailScreen}
				options={{ title: 'Категория' }}
			/>
			<CategoriesStack.Screen
				name='CategoryForm'
				component={CategoryFormScreen}
				options={({ route }) => ({
					title: route.params?.id ? 'Редактирование' : 'Новая категория',
				})}
			/>
		</CategoriesStack.Navigator>
	)
}

// --- More Stack ---
const MoreStack = createNativeStackNavigator<MoreStackParamList>()
function MoreStackScreen() {
	return (
		<MoreStack.Navigator screenOptions={screenOptions}>
			<MoreStack.Screen
				name='MoreMenu'
				component={MoreScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='Properties'
				component={PropertiesScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='Pages'
				component={PagesScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='PageForm'
				component={PageFormScreen}
				options={({ route }) => ({
					title: route.params?.id ? 'Редактирование' : 'Новая страница',
				})}
			/>
			<MoreStack.Screen
				name='Seo'
				component={SeoScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='Webhooks'
				component={WebhooksScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='ImportExport'
				component={ImportExportScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='Settings'
				component={SettingsScreen}
				options={{ headerShown: false }}
			/>
			<MoreStack.Screen
				name='Navigation'
				component={NavigationScreen}
				options={{ headerShown: false }}
			/>
		</MoreStack.Navigator>
	)
}

export function AdminTabNavigator() {
	usePushNotifications()

	return (
		<Tab.Navigator
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.mutedForeground,
				tabBarStyle: {
					borderTopWidth: 1,
					borderTopColor: colors.separator,
					backgroundColor: colors.card,
					height: 64,
					paddingBottom: 2,
					paddingTop: 4,
					...elevation(2),
				},
				tabBarLabelStyle: {
					fontFamily: fontFamily.base,
					fontSize: 11,
					fontWeight: '600',
					letterSpacing: 0.2,
					marginTop: 1,
				},
				tabBarItemStyle: {
					gap: 1,
				},
			}}
		>
			<Tab.Screen
				name='DashboardTab'
				component={DashboardScreen}
				options={{
					title: 'Главная',
					tabBarIcon: ({ color, focused, size }) => (
						<View
							style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}
						>
							<LayoutDashboard size={20} color={color} />
						</View>
					),
				}}
			/>
			<Tab.Screen
				name='ProductsTab'
				component={ProductsStackScreen}
				options={{
					title: 'Товары',
					tabBarIcon: ({ color, focused }) => (
						<View
							style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}
						>
							<Package size={20} color={color} />
						</View>
					),
				}}
			/>
			<Tab.Screen
				name='OrdersTab'
				component={OrdersStackScreen}
				options={{
					title: 'Заказы',
					tabBarIcon: ({ color, focused }) => (
						<View
							style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}
						>
							<ShoppingCart size={20} color={color} />
						</View>
					),
				}}
			/>
			<Tab.Screen
				name='CategoriesTab'
				component={CategoriesStackScreen}
				options={{
					title: 'Категории',
					tabBarIcon: ({ color, focused }) => (
						<View
							style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}
						>
							<FolderOpen size={20} color={color} />
						</View>
					),
				}}
			/>
			<Tab.Screen
				name='MoreTab'
				component={MoreStackScreen}
				options={{
					title: 'Ещё',
					tabBarIcon: ({ color, focused }) => (
						<View
							style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}
						>
							<Menu size={20} color={color} />
						</View>
					),
				}}
			/>
		</Tab.Navigator>
	)
}

const tabStyles = StyleSheet.create({
	iconWrap: {
		width: 52,
		height: 28,
		borderRadius: borderRadius.md,
		justifyContent: 'center',
		alignItems: 'center',
	},
	iconWrapActive: {
		backgroundColor: colors.primary + '14',
	},
})
