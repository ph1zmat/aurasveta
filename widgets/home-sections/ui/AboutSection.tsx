'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

interface AboutSectionConfig {
	heading?: string
	paragraphs?: string[]
	expandable?: boolean
}

interface AboutSectionProps {
	title?: string | null
	config?: AboutSectionConfig
}

const DEFAULT_HEADING = 'Интернет магазин освещения Аура Света'

const DEFAULT_PARAGRAPHS = [
	'Компания «Аура Света» предлагает большой выбор осветительных приборов с доставкой по Москве, Санкт-Петербургу и всей территории России. Мы реализуем современные люстры и светильники, а также другое оборудование: настольные лампы и бра.',
	'На нашем сайте представлен обширный ассортимент товаров для создания системы освещения интерьеров. Мы сотрудничаем с ведущими мировыми производителями осветительного оборудования и предлагаем только качественную продукцию.',
	'Наши специалисты помогут подобрать оптимальное решение для любого помещения — от уютной спальни до просторного офисного зала. Мы обеспечиваем бесплатную доставку, профессиональный монтаж и гарантию на весь ассортимент.',
]

export default function AboutSection({ title, config }: AboutSectionProps) {
	const [expanded, setExpanded] = useState(false)

	const heading = config?.heading ?? title ?? DEFAULT_HEADING
	const paragraphs =
		config?.paragraphs && config.paragraphs.length > 0
			? config.paragraphs
			: DEFAULT_PARAGRAPHS
	const expandable = config?.expandable ?? true

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-10'>
			<h2 className='mb-4 text-xl font-semibold tracking-widest text-foreground'>
				{heading}
			</h2>
			<div
				className={cn(
					'overflow-hidden text-sm leading-relaxed tracking-wider text-muted-foreground transition-all duration-300',
					expandable && !expanded ? 'max-h-[100px]' : 'max-h-[2000px]',
				)}
			>
				{paragraphs.map((p, i) => (
					<p key={i} className={i < paragraphs.length - 1 ? 'mb-3' : undefined}>
						{p}
					</p>
				))}
			</div>
			{expandable && (
				<Button
					variant='link'
					onClick={() => setExpanded(!expanded)}
					className='mt-3 uppercase tracking-widest'
				>
					{expanded ? 'Свернуть описание' : 'Развернуть описание'}
					<ChevronDown
						className={cn(
							'h-4 w-4 transition-transform',
							expanded && 'rotate-180',
						)}
					/>
				</Button>
			)}
		</section>
	)
}
