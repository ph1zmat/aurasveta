import { Eye } from 'lucide-react'
import Link from 'next/link'

interface InterestCounterProps {
	views: number
}

export default function InterestCounter({ views }: InterestCounterProps) {
	return (
		<p className='flex items-center gap-2 py-4 text-sm text-muted-foreground'>
			<Eye className='h-4 w-4' strokeWidth={1.5} />
			Этим товаром интересуются!{' '}
			<Link
				href='#'
				className='text-foreground underline underline-offset-2 transition-colors hover:text-primary'
			>
				Посмотрели {views} человека
			</Link>
		</p>
	)
}
