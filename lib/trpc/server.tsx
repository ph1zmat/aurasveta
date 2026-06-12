import 'server-only'

import { cache } from 'react'
import { createHydrationHelpers } from '@trpc/react-query/rsc'
import { headers } from 'next/headers'
import { createTRPCContext, createCallerFactory } from './init'
import { makeQueryClient } from './queryclient'
import { appRouter, type AppRouter } from './routers/app'

export const getQueryClient = cache(makeQueryClient)

const authAwareCaller = createCallerFactory(appRouter)(async () =>
	createTRPCContext({ headers: await headers() }),
)

const publicCaller = createCallerFactory(appRouter)(async () =>
	// Публичный caller без чтения request headers — не форсирует dynamic rendering,
	// поэтому его можно использовать в ISR-страницах storefront.
	createTRPCContext({ headers: new Headers() }),
)

export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
	authAwareCaller,
	getQueryClient,
)

export const { trpc: publicTrpc, HydrateClient: PublicHydrateClient } =
	createHydrationHelpers<AppRouter>(publicCaller, getQueryClient)
