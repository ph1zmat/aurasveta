import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
	...nextVitals,
	...nextTs,
	{
		rules: {
			'jsx-a11y/alt-text': 'warn',
			'jsx-a11y/anchor-is-valid': 'warn',
			'jsx-a11y/aria-props': 'warn',
			'jsx-a11y/aria-role': 'warn',
			'jsx-a11y/aria-unsupported-elements': 'warn',
			'jsx-a11y/heading-has-content': 'warn',
			'jsx-a11y/no-redundant-roles': 'warn',
			'jsx-a11y/role-has-required-aria-props': 'warn',
			'jsx-a11y/role-supports-aria-props': 'warn',
		},
	},
	// Override default ignores of eslint-config-next.
	globalIgnores([
		// Default ignores of eslint-config-next:
		'.next/**',
		'out/**',
		'build/**',
		'**/node_modules/**',
		'next-env.d.ts',
		// Desktop build artifacts (can be huge and not source-controlled)
		'desktop/**',
		'**/desktop/**',
		// Mobile is a separate app with its own linting needs
		'mobile/**',
		'**/mobile/**',
	]),
	// Ban mock imports in production code
	{
		files: ['**/*.{ts,tsx}'],
		ignores: [
			'**/*.test.*',
			'**/*.spec.*',
			'**/tests/**',
			'**/__tests__/**',
			'prisma/seed.ts',
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['@/shared/mocks/*', '*/shared/mocks/*'],
							message:
								'Mock data imports are banned in production code. Use real DB queries via tRPC or entity services.',
						},
					],
				},
			],
		},
	},
])

export default eslintConfig
