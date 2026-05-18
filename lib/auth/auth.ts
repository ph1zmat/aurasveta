import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { bearer } from 'better-auth/plugins'
import { prisma } from '@/lib/prisma'
import { AUTH_TRUSTED_ORIGINS } from '@/lib/config/origins'

export const auth = betterAuth({
	trustedOrigins: AUTH_TRUSTED_ORIGINS,
	database: prismaAdapter(prisma, {
		provider: 'postgresql',
	}),
	plugins: [bearer()],
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

