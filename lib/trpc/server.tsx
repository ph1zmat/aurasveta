import 'server-only'

import { cache } from 'react'
import { createHydrationHelpers } from '@trpc/react-query/rsc'
import { headers } from 'next/headers'
import { createTRPCContext, createCallerFactory } from './init'
import { makeQueryClient } from './queryclient'
import { appRouter, type AppRouter } from './routers/app'

export const getQueryClient = cache(makeQueryClient)

const caller = createCallerFactory(appRouter)(async () =>
	createTRPCContext({ headers: await headers() }),
)

export const { trpc, HydrateClient } = createHydrationHelpers<AppRouter>(
	caller,
	getQueryClient,
)

