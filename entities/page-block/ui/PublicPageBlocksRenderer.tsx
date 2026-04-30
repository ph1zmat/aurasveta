import * as LucideIcons from 'lucide-react'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'
import type { PageBlockRecord } from '@/shared/types/page-builder'
import { PAGE_BLOCK_TYPES, type PageBlockType } from '@/shared/types/page-builder'

interface Props {
	blocks: PageBlockRecord[]
}

function HeadingBlock({ config }: { config: Record<string, unknown> }) {
	const text = typeof config.text === 'string' ? config.text : ''
	const level = typeof config.level === 'string' ? config.level : 'h2'
	const className = 'font-bold tracking-tight'

	switch (level) {
		case 'h1':
			return <h1 className={`${className} text-3xl md:text-4xl`}>{text}</h1>
		case 'h3':
			return <h3 className={`${className} text-xl md:text-2xl`}>{text}</h3>
		case 'h4':
			return <h4 className={`${className} text-lg md:text-xl`}>{text}</h4>
		default:
			return <h2 className={`${className} text-2xl md:text-3xl`}>{text}</h2>
	}
}

function ParagraphBlock({ config }: { config: Record<string, unknown> }) {
	const text = typeof config.text === 'string' ? config.text : ''
	return (
		<p className='text-base leading-relaxed text-foreground/90 whitespace-pre-line'>
			{text}
		</p>
	)
}

function TableBlock({ config }: { config: Record<string, unknown> }) {
	const caption = typeof config.caption === 'string' ? config.caption : ''
	const columns = Array.isArray(config.columns)
		? (config.columns as Array<{ key: string; label: string }>)
		: []
	const rows = Array.isArray(config.rows) ? (config.rows as string[][]) : []

	if (columns.length === 0) return null

	return (
		<div className='overflow-x-auto'>
			<table className='min-w-full border-collapse text-sm'>
				{caption ? (
					<caption className='mb-2 text-left text-sm text-muted-foreground'>
						{caption}
					</caption>
				) : null}
				<thead>
					<tr>
						{columns.map((col) => (
							<th
								key={col.key}
								className='border border-border bg-muted px-4 py-2 text-left font-medium'
							>
								{col.label}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, ri) => (
						<tr key={ri} className='even:bg-muted/30'>
							{columns.map((col, ci) => (
								<td key={col.key} className='border border-border px-4 py-2'>
									{row[ci] ?? ''}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

function ImageBlock({ config }: { config: Record<string, unknown> }) {
	const storageKey = typeof config.storageKey === 'string' ? config.storageKey : ''
	const alt = typeof config.alt === 'string' ? config.alt : ''
	const caption = typeof config.caption === 'string' ? config.caption : ''
	const alignment = typeof config.alignment === 'string' ? config.alignment : 'center'
	const widthMode = typeof config.widthMode === 'string' ? config.widthMode : 'normal'

	if (!storageKey) return null

	const url = resolveStorageFileUrl(storageKey)
	if (!url) return null

	const widthClass =
		widthMode === 'full'
			? 'w-full'
			: widthMode === 'wide'
				? 'max-w-3xl'
				: widthMode === 'narrow'
					? 'max-w-sm'
					: 'max-w-xl'

	const alignClass =
		alignment === 'left' ? 'mr-auto' : alignment === 'right' ? 'ml-auto' : 'mx-auto'

	return (
		<figure className={`${widthClass} ${alignClass}`}>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={url}
				alt={alt}
				className='w-full rounded-lg object-cover'
				loading='lazy'
			/>
			{caption ? (
				<figcaption className='mt-2 text-center text-xs text-muted-foreground'>
					{caption}
				</figcaption>
			) : null}
		</figure>
	)
}

function LinkBlock({ config }: { config: Record<string, unknown> }) {
	const label = typeof config.label === 'string' ? config.label : ''
	const href = typeof config.href === 'string' ? config.href : '#'
	const isExternal = config.isExternal === true

	return (
		<a
			href={href}
			target={isExternal ? '_blank' : undefined}
			rel={isExternal ? 'noopener noreferrer' : undefined}
			className='inline-flex items-center gap-1 text-accent underline underline-offset-4 hover:text-accent/80 transition-colors'
		>
			{label}
		</a>
	)
}

function IconLinkBlock({ config }: { config: Record<string, unknown> }) {
	const label = typeof config.label === 'string' ? config.label : ''
	const href = typeof config.href === 'string' ? config.href : '#'
	const iconToken = typeof config.icon === 'string' ? config.icon : 'ArrowRight'
	const description = typeof config.description === 'string' ? config.description : ''
	const isExternal = config.isExternal === true

	const IconComponent = (LucideIcons[iconToken as keyof typeof LucideIcons] ??
		LucideIcons.ArrowRight) as React.ElementType

	return (
		<a
			href={href}
			target={isExternal ? '_blank' : undefined}
			rel={isExternal ? 'noopener noreferrer' : undefined}
			className='group flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-accent hover:bg-accent/5'
		>
			<IconComponent className='mt-0.5 h-5 w-5 shrink-0 text-accent' aria-hidden='true' />
			<div className='min-w-0'>
				<span className='block font-medium text-foreground group-hover:text-accent transition-colors'>
					{label}
				</span>
				{description ? (
					<span className='block text-sm text-muted-foreground'>{description}</span>
				) : null}
			</div>
		</a>
	)
}

export default function PublicPageBlocksRenderer({ blocks }: Props) {
	const activeBlocks = blocks.filter(b => {
		if (!b.isActive) return false
		if (!PAGE_BLOCK_TYPES.includes(b.type as PageBlockType)) return false
		return true
	})

	if (activeBlocks.length === 0) return null

	return (
		<div className='space-y-6'>
			{activeBlocks.map((block) => {
				const cfg = (block.config && typeof block.config === 'object' && !Array.isArray(block.config)
					? block.config
					: {}) as Record<string, unknown>

				switch (block.type as PageBlockType) {
					case 'heading':
						return <HeadingBlock key={block.id} config={cfg} />
					case 'paragraph':
						return <ParagraphBlock key={block.id} config={cfg} />
					case 'table':
						return <TableBlock key={block.id} config={cfg} />
					case 'image':
						return <ImageBlock key={block.id} config={cfg} />
					case 'link':
						return <LinkBlock key={block.id} config={cfg} />
					case 'icon-link':
						return <IconLinkBlock key={block.id} config={cfg} />
					default:
						return null
				}
			})}
		</div>
	)
}
