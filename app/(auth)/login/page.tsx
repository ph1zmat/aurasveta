import type { Metadata } from 'next'
import { requireUnauth } from '@/lib/auth/authutils'
import LoginForm from './loginform'

export const metadata: Metadata = {
	title: 'Вход — Аура Света',
	description: 'Войдите в свой аккаунт интернет-магазина Аура Света',
	robots: { index: false, follow: true },
}

export default async function LoginPage() {
	await requireUnauth()

	return (
		<div className='flex min-h-screen items-start justify-center bg-background px-4 py-6 sm:items-center sm:py-12'>
			<div className='w-full max-w-md space-y-6'>
				<div className='text-center'>
					<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground sm:text-2xl'>
						Вход
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						Войдите в свой аккаунт
					</p>
				</div>
				<LoginForm />
			</div>
		</div>
	)
}
