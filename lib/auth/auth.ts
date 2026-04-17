import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'

export const auth = betterAuth({
	trustedOrigins: [
		'http://localhost:3000',
		'http://localhost:5173',
		'http://localhost:8081',
		'http://127.0.0.1:5173',
		process.env.NEXT_PUBLIC_APP_URL || 'https://aurasveta.ru',
		'https://aurasveta.ru',
		'exp+auracms://',
		'aurasveta://',
	],
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	user: {
		additionalFields: {
			role: {
				type: 'string',
				defaultValue: 'USER',
				input: false,
			},
			phone: {
				type: 'string',
				required: false,
				input: false,
			},
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	socialProviders: {
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
			enabled: !!process.env.GITHUB_CLIENT_ID,
		},
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
			enabled: !!process.env.GOOGLE_CLIENT_ID,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24, // 1 day
		updateAge: 60 * 60, // 1 hour
	},
	secret: process.env.BETTER_AUTH_SECRET,
})

export type Session = typeof auth.$Infer.Session
