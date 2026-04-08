import { createTRPCRouter } from '../init'
import { categoriesRouter } from './categories'
import { productsRouter } from './products'
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
})

export type AppRouter = typeof appRouter
