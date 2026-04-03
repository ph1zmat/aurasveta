import Link from 'next/link'

interface SectionHeaderProps {
	title: string
	href?: string
	linkText?: string
}

export default function SectionHeader({
	title,
	href,
	linkText,
}: SectionHeaderProps) {
	return (
		<div className='mb-4 flex items-center justify-between md:mb-6'>
			<h2 className='text-lg font-bold uppercase tracking-wider text-foreground'>
				{title}
			</h2>
			{href && linkText && (
				<Link href={href} className='text-sm text-primary hover:underline'>
					{linkText}
				</Link>
			)}
		</div>
	)
}
