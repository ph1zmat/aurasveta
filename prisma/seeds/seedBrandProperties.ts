import { SeedPropertyDefinition } from './seedTypes'

// Отфильтрованные property definitions — только разрешенные характеристики

export const BRAND_PROPERTY_DEFINITIONS: SeedPropertyDefinition[] = [
  { slug: 'brand', name: 'Бренд' },
  { slug: 'weight_netto', name: 'Вес нетто' },
  { slug: 'diameter_mm', name: 'Диаметр, мм' },
  { slug: 'height_mm', name: 'Высота, мм' },
  { slug: 'light_source', name: 'Источник света' },
  { slug: 'lamp_count', name: 'Количество ламп' },
  { slug: 'lampshade_material', name: 'Материал абажура' },
  { slug: 'lampshade_color', name: 'Цвет абажура' },
  { slug: 'frame_color', name: 'Цвет арматуры', hasPhoto: true },
  { slug: 'product_type', name: 'Тип товара' },
  { slug: 'length_mm', name: 'Длина, мм' },
  { slug: 'frame_material', name: 'Материал арматуры' },
]

// Reverse mapping for property lookups — только разрешенные slug-и
export const PROPERTY_SLUG_MAP: Record<string, string> = {
  'Бренд': 'brand',
  'Материал арматуры': 'frame_material',
  'Цвет арматуры': 'frame_color',
  'Высота, мм': 'height_mm',
  'Высота (H), мм': 'height_mm',
  'Высота мм': 'height_mm',
  'Высота': 'height_mm',
  'Длина, мм': 'length_mm',
  'Длина мм': 'length_mm',
  'Длина': 'length_mm',
  'Диаметр, мм': 'diameter_mm',
  'Диаметр (D), мм': 'diameter_mm',
  'Диаметр мм': 'diameter_mm',
  'Диаметр': 'diameter_mm',
  'Вес нетто': 'weight_netto',
  'Вес без упаковки': 'weight_netto',
  'Нетто': 'weight_netto',
  'Количество ламп': 'lamp_count',
  'Количество плафонов': 'lamp_count',
  'Источник света': 'light_source',
  'Тип товара': 'product_type',
  'Вид': 'product_type',
  'Материал абажура': 'lampshade_material',
  'Цвет абажура': 'lampshade_color',
}
