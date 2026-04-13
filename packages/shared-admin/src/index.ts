/**
 * Shared types and tRPC client creator for Electron and React Native apps.
 * 
 * AppRouter type is imported from the main web project via path reference.
 */

export { createAdminTRPCClient, type AdminTRPCClient } from './trpc-client'
export type { AppRouter } from './types'
export * from './types'
