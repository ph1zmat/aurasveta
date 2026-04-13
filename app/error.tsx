'use client'

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string }
	reset: () => void
}) {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-background px-4'>
			<h1 className='text-2xl font-semibold text-foreground'>
				Что-то пошло не так
			</h1>
			<p className='mt-2 text-sm text-muted-foreground'>
				{error.message || 'Произошла непредвиденная ошибка'}
			</p>
			<button
				onClick={reset}
				className='mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
			>
				Попробовать снова
			</button>
		</div>
	)
}
