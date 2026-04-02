interface SEOTextProps {
	content: string
}

export default function SEOText({ content }: SEOTextProps) {
	return (
		<div className='border-t border-border py-8'>
			<div
				className='prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground [&_a]:text-primary'
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		</div>
	)
}
