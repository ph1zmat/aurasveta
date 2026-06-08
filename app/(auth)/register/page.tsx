import type { Metadata } from 'next'
import { requireUnauth } from '@/lib/auth/authutils'
import RegisterForm from './registerform'

export const metadata: Metadata = {
	title: 'Регистрация — Аура Света',
	description: 'Создайте аккаунт в интернет-магазине Аура Света',
	robots: { index: false, follow: true },
}

export default async function RegisterPage() {
	await requireUnauth()

	return (
		<div className='flex min-h-screen items-start justify-center bg-background px-4 py-6 sm:items-center sm:py-12'>
			<div className='w-full max-w-md space-y-6'>
				<div className='text-center'>
					<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground sm:text-2xl'>
						Регистрация
					</h1>
					<p className='mt-2 text-sm text-muted-foreground'>
						Создайте новый аккаунт
					</p>
				</div>
				<RegisterForm />
			</div>
		</div>
	)
}
