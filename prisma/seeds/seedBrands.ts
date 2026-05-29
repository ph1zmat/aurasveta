// Auto-generated unified brand seeds
// Imports all brand product generators
// Currency: BYN (Belarusian rubles)
// Price sources:
//   - Excel Прайс (ОПТ РБ с НДС): Sonex, Ambrella, Arte Lamp, Favourite,
//     Lumion, MODELUX, Novotech, Odeon, Eurosvet, Kink Light,
//     Elektrostandard, Lightstar, LoFT IT
//   - Converted RUB→BYN: MODELUX (rate 1/29.5), LED4U (rate 1/29.5),
//     Maytoni (rate 1/29.5), Freya (rate 1/29.5)

import { SeedProductDefinition } from './seedTypes'

// Brand imports
import { getSonexProducts } from './seedSonex'
import { getAmbrellaProducts } from './seedAmbrella'
import { getArteLampProducts } from './seedArteLamp'
import { getFavouriteProducts } from './seedFavourite'
import { getFreyaProducts } from './seedFreya'
import { getLED4UProducts } from './seedLED4U'
import { getLightstarProducts } from './seedLightstar'
import { getLoFTITProducts } from './seedLoFTIT'
import { getLumionProducts } from './seedLumion'
import { getMODELUXProducts } from './seedMODELUX'
import { getNovotechProducts } from './seedNovotech'
import { getOdeonProducts } from './seedOdeon'
import { getEurosvetProducts } from './seedEurosvet'
import { getKinkLightProducts } from './seedKinkLight'
import { getMaytoniProducts } from './seedMaytoni'
import { getElektrostandardProducts } from './seedElektrostandard'

export type BrandName =
	| 'Sonex'
	| 'Ambrella'
	| 'Arte Lamp'
	| 'Favourite'
	| 'Freya'
	| 'LED4U'
	| 'Lightstar'
	| 'LoFT IT'
	| 'Lumion'
	| 'MODELUX'
	| 'Novotech'
	| 'Odeon'
	| 'Eurosvet'
	| 'Kink Light'
	| 'Maytoni'
	| 'Elektrostandard'

export const BRAND_COUNTRIES: Record<string, string> = {
	Sonex: 'Польша',
	Ambrella: 'Китай',
	'Arte Lamp': 'Италия',
	Favourite: 'Германия',
	Freya: 'Германия',
	LED4U: 'Китай',
	Lightstar: 'Италия',
	'LoFT IT': 'Испания',
	Lumion: 'Италия',
	MODELUX: 'Китай',
	Novotech: 'Венгрия',
	Odeon: 'Италия',
	Eurosvet: 'Россия',
	'Kink Light': 'Китай',
	Maytoni: 'Германия',
	Elektrostandard: 'Германия',
}

export const BRAND_PRODUCT_COUNTS: Record<string, number> = {
	Sonex: 17,
	Ambrella: 1379,
	'Arte Lamp': 3523,
	Favourite: 1977,
	Freya: 1608,
	LED4U: 532,
	Lightstar: 3781,
	'LoFT IT': 1362,
	Lumion: 930,
	MODELUX: 2034,
	Novotech: 1490,
	Odeon: 2530,
	Eurosvet: 2059,
	'Kink Light': 976,
	Maytoni: 744,
	Elektrostandard: 2142,
}

export function createRawBrandProducts(): SeedProductDefinition[] {
	return [
		...getSonexProducts(),
		...getAmbrellaProducts(),
		...getArteLampProducts(),
		...getFavouriteProducts(),
		...getFreyaProducts(),
		...getLED4UProducts(),
		...getLightstarProducts(),
		...getLoFTITProducts(),
		...getLumionProducts(),
		...getMODELUXProducts(),
		...getNovotechProducts(),
		...getOdeonProducts(),
		...getEurosvetProducts(),
		...getKinkLightProducts(),
		...getMaytoniProducts(),
		...getElektrostandardProducts(),
	]
}

export function createBrandProducts(): SeedProductDefinition[] {
	const allProducts = createRawBrandProducts()

	const seenSlugs = new Set<string>()
	const uniqueProducts = allProducts.filter(p => {
		if (seenSlugs.has(p.slug)) {
			return false
		}
		seenSlugs.add(p.slug)
		return true
	})

	return uniqueProducts
}

export function getProductsByBrand(brand: BrandName): SeedProductDefinition[] {
	const allProducts = createBrandProducts()
	return allProducts.filter(p => p.brand === brand)
}

export function getBrandNames(): BrandName[] {
	return Object.keys(BRAND_COUNTRIES) as BrandName[]
}
