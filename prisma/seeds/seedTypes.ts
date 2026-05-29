// Auto-generated types for brand seed files

export type SeedPropertyDefinition = {
  slug: string
  name: string
  hasPhoto?: boolean
}

export type SeedPropertyValue = {
  key: string
  value: string | number | boolean
}

export type SeedProductImage = {
  path: string
  isMain: boolean
}

export type SeedProductDefinition = {
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  sku: string
  categorySlug: string
  brand: string
  brandCountry: string
  badges: string[]
  rating: number
  reviewsCount: number
  metaTitle: string
  metaDesc: string
  images: SeedProductImage[]
  propertyValues: SeedPropertyValue[]
}
