import type { NativeStackScreenProps } from '@react-navigation/native-stack'

// Products stack
export type ProductsStackParamList = {
  ProductsList: undefined
  ProductForm: { id?: string } | undefined
}

// Orders stack
export type OrdersStackParamList = {
  OrdersList: undefined
  OrderDetail: { order: any }
}

// Categories stack
export type CategoriesStackParamList = {
  CategoriesList: undefined
  CategoryDetail: { category: any }
  CategoryForm: { id?: string; parentId?: string } | undefined
}

// More stack
export type MoreStackParamList = {
  MoreMenu: undefined
  Properties: undefined
  Pages: undefined
  PageForm: { id?: string } | undefined
  Seo: undefined
  Webhooks: undefined
  ImportExport: undefined
  Settings: undefined
}

// Screen props helpers
export type ProductsListProps = NativeStackScreenProps<ProductsStackParamList, 'ProductsList'>
export type ProductFormProps = NativeStackScreenProps<ProductsStackParamList, 'ProductForm'>
export type OrdersListProps = NativeStackScreenProps<OrdersStackParamList, 'OrdersList'>
export type OrderDetailProps = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>
export type CategoriesListProps = NativeStackScreenProps<CategoriesStackParamList, 'CategoriesList'>
export type CategoryDetailProps = NativeStackScreenProps<CategoriesStackParamList, 'CategoryDetail'>
export type CategoryFormProps = NativeStackScreenProps<CategoriesStackParamList, 'CategoryForm'>
export type MoreMenuProps = NativeStackScreenProps<MoreStackParamList, 'MoreMenu'>
