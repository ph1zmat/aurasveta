import { requireUnauth } from '@/lib/auth/auth-utils'
import RegisterForm from './RegisterForm'

export default async function RegisterPage() {
	await requireUnauth()

	return (
		<div className='flex min-h-screen items-center justify-center bg-background px-4'>
			<div className='w-full max-w-md space-y-8'>
				<div className='text-center'>
					<h1 className='text-2xl font-semibold uppercase tracking-widest text-foreground'>
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
