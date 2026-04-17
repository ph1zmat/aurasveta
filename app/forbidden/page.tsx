import Link from 'next/link'
import { Button } from '@/shared/ui/Button'

export const metadata = {
	title: 'Нет доступа — Аура Света',
}

export default function ForbiddenPage() {
	return (
		<div className='mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 text-center'>
			<h1 className='text-2xl font-semibold tracking-widest text-foreground'>
				Нет доступа
			</h1>
			<p className='mt-2 text-sm text-muted-foreground'>
				У вашей учётной записи нет прав для просмотра этого раздела.
			</p>

			<div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
				<Button asChild variant='primary'>
					<Link href='/'>На главную</Link>
				</Button>
				<Button asChild variant='outline'>
					<Link href='/login'>Войти под другой учётной записью</Link>
				</Button>
			</div>
		</div>
	)
}

