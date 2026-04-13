import type { Metadata } from 'next'
import { requireUnauth } from '@/lib/auth/auth-utils'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
	title: 'Вход — Аура Света',
	description: 'Войдите в свой аккаунт интернет-магазина Аура Света',
}

export default async function LoginPage() {
	await requireUnauth()

	return (
		<div className='flex min-h-screen items-center justify-center bg-background px-4'>
			<div className='w-full max-w-md space-y-8'>
				<div className='text-center'>
					<h1 className='text-2xl font-semibold uppercase tracking-widest text-foreground'>
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
