import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { DashboardScreen } from '../screens/DashboardScreen'
import { ProductsScreen } from '../screens/ProductsScreen'
import { OrdersScreen } from '../screens/OrdersScreen'
import { CategoriesScreen } from '../screens/CategoriesScreen'
import { MoreScreen } from '../screens/MoreScreen'

const Tab = createBottomTabNavigator()

export function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fafafa' },
        headerTitleStyle: { fontSize: 16, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { borderTopColor: '#e5e5e5' },
      }}
    >
      <Tab.Screen name="Дашборд" component={DashboardScreen} options={{ tabBarLabel: 'Главная' }} />
      <Tab.Screen name="Товары" component={ProductsScreen} />
      <Tab.Screen name="Заказы" component={OrdersScreen} />
      <Tab.Screen name="Категории" component={CategoriesScreen} />
      <Tab.Screen name="Ещё" component={MoreScreen} />
    </Tab.Navigator>
  )
}
