import Link from 'next/link'

type Block = {
	type?: string
	data?: Record<string, unknown>
}

function asString(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export default function PageRenderer({ content }: { content: unknown }) {
	if (!Array.isArray(content)) return null

	const blocks = content as Block[]

	return (
		<div className='space-y-6'>
			{blocks.map((block, index) => {
				const type = block?.type
				const data = block?.data ?? {}
				const key = `${type ?? 'block'}-${index}`

				switch (type) {
					case 'heading': {
						const level = asNumber(data.level, 2)
						const text = asString(data.text)
						if (!text) return null

						if (level <= 1) return <h1 key={key}>{text}</h1>
						if (level === 3) return <h3 key={key}>{text}</h3>
						if (level >= 4) return <h4 key={key}>{text}</h4>
						return <h2 key={key}>{text}</h2>
					}

					case 'paragraph': {
						const text = asString(data.text)
						if (!text) return null
						return (
							<p key={key} className='leading-relaxed text-foreground/90'>
								{text}
							</p>
						)
					}

					case 'image': {
						const src = asString(data.src)
						if (!src) return null
						const alt = asString(data.alt, 'Изображение')
						// eslint-disable-next-line @next/next/no-img-element
						return <img key={key} src={src} alt={alt} className='w-full rounded-xl object-cover' />
					}

					case 'gallery': {
						const images = Array.isArray(data.images)
							? (data.images as Array<{ src?: string; alt?: string }>)
							: []
						if (images.length === 0) return null

						return (
							<div key={key} className='grid grid-cols-2 gap-3'>
								{images.map((img, i) =>
									img?.src ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											key={`${key}-${i}`}
											src={img.src}
											alt={img.alt || `Изображение ${i + 1}`}
											className='h-48 w-full rounded-xl object-cover'
										/>
									) : null,
								)}
							</div>
						)
					}

					case 'table': {
						const headers = Array.isArray(data.headers)
							? (data.headers as string[])
							: []
						const rows = Array.isArray(data.rows)
							? (data.rows as Array<Array<string | number>>)
							: []
						if (headers.length === 0 && rows.length === 0) return null

						return (
							<div key={key} className='overflow-x-auto rounded-xl border border-border'>
								<table className='w-full text-sm'>
									{headers.length > 0 && (
										<thead>
											<tr className='bg-muted/30 text-left'>
												{headers.map((h, i) => (
													<th key={`${key}-h-${i}`} className='px-3 py-2 font-medium'>
														{h}
													</th>
												))}
											</tr>
										</thead>
									)}
									<tbody>
										{rows.map((row, rowIndex) => (
											<tr key={`${key}-r-${rowIndex}`} className='border-t border-border/60'>
												{row.map((cell, cellIndex) => (
													<td key={`${key}-c-${rowIndex}-${cellIndex}`} className='px-3 py-2'>
														{String(cell)}
													</td>
												))}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)
					}

					case 'ctaButton': {
						const label = asString(data.label, 'Подробнее')
						const href = asString(data.href, '#')
						return (
							<div key={key}>
								<Link
									href={href}
									className='inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
								>
									{label}
								</Link>
							</div>
						)
					}

					default:
						return null
				}
			})}
		</div>
	)
}
