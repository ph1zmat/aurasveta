import { createTRPCRouter } from '../init'
import { categoriesRouter } from './categories'
import { productsRouter } from './products-router'
import { propertiesRouter } from './properties'
import { cartRouter } from './cart'
import { compareRouter } from './compare'
import { favoritesRouter } from './favorites'
import { ordersRouter } from './orders'
import { pagesRouter } from './pages'
import { adminRouter } from './admin'
import { profileRouter } from './profile'
import { anonymousRouter } from './anonymous'
import { webhooksRouter } from './webhooks'
import { searchRouter } from './search'
import { recommendationsRouter } from './recommendations'
import { seoRouter } from './seo'
import { pushRouter } from './push'
import { sectionTypeRouter } from './sectionType'
import { homeSectionRouter } from './homeSection'
import { settingRouter } from './setting'
import { cmsRouter } from './cms'
import { shopSettingsRouter } from './shopSettings'
import { settingsBusinessRouter } from './admin/settings.business'
import { notificationsRouter } from './notifications'
import { importOperationsRouter } from './importOperations'
import { siteNavRouter } from './siteNav'

export const appRouter = createTRPCRouter({
	categories: categoriesRouter,
	products: productsRouter,
	properties: propertiesRouter,
	cart: cartRouter,
	compare: compareRouter,
	favorites: favoritesRouter,
	orders: ordersRouter,
	pages: pagesRouter,
	admin: adminRouter,
	profile: profileRouter,
	anonymous: anonymousRouter,
	webhooks: webhooksRouter,
	search: searchRouter,
	recommendations: recommendationsRouter,
	seo: seoRouter,
	push: pushRouter,
	sectionType: sectionTypeRouter,
	homeSection: homeSectionRouter,
	setting: settingRouter,
	cms: cmsRouter,
	shopSettings: shopSettingsRouter,
	settingsBusiness: settingsBusinessRouter,
	notifications: notificationsRouter,
	importOperations: importOperationsRouter,
	siteNav: siteNavRouter,
})

export type AppRouter = typeof appRouter
