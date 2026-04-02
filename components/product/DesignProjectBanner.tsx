import Link from 'next/link'

interface DesignProjectBannerProps {
	href?: string
}

export default function DesignProjectBanner({
	href = '/design',
}: DesignProjectBannerProps) {
	return (
		<div className='rounded-sm bg-destructive/10 px-6 py-4'>
			<p className='text-sm text-foreground'>
				Есть дизайн проект?{' '}
				<Link
					href={href}
					className='font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary'
				>
					Пришлите нам
				</Link>
			</p>
		</div>
	)
}
