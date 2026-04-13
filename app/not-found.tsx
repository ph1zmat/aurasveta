import Link from 'next/link'

export default function NotFound() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<h1 className='text-6xl font-bold text-foreground'>404</h1>
			<p className='mt-4 text-lg text-muted-foreground'>Страница не найдена</p>
			<Link
				href='/'
				className='mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
			>
				На главную
			</Link>
		</div>
	)
}
