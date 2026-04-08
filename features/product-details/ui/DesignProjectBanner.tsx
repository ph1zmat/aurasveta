import Link from 'next/link'
import { Card } from '@/shared/ui/Card'

interface DesignProjectBannerProps {
	href?: string
}

export default function DesignProjectBanner({
	href = '/design',
}: DesignProjectBannerProps) {
	return (
		<Card variant='banner' padding='banner'>
			<p className='text-sm tracking-wide text-foreground'>
				Есть дизайн проект?{' '}
				<Link
					href={href}
					className='font-normal text-foreground underline underline-offset-2 transition-colors hover:text-primary'
				>
					Пришлите нам
				</Link>
			</p>
		</Card>
	)
}
