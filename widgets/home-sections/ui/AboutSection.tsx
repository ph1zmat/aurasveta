'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

export default function AboutSection() {
	const [expanded, setExpanded] = useState(false)

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-10'>
			<h2 className='mb-4 text-xl font-semibold tracking-widest text-foreground'>
				Интернет магазин освещения Аура Света
			</h2>
			<div
				className={cn(
					'overflow-hidden text-sm leading-relaxed tracking-wider text-muted-foreground transition-all duration-300',
					expanded ? 'max-h-[1000px]' : 'max-h-[100px]',
				)}
			>
				<p className='mb-3'>
					Компания «Аура Света» предлагает большой выбор осветительных приборов
					с доставкой по Москве, Санкт-Петербургу и всей территории России. Мы
					реализуем современные люстры и светильники, а также другое
					оборудование: настольные лампы и бра.
				</p>
				<p className='mb-3'>
					На нашем сайте представлен обширный ассортимент товаров для создания
					системы освещения интерьеров. Мы сотрудничаем с ведущими мировыми
					производителями осветительного оборудования и предлагаем только
					качественную продукцию.
				</p>
				<p>
					Наши специалисты помогут подобрать оптимальное решение для любого
					помещения — от уютной спальни до просторного офисного зала. Мы
					обеспечиваем бесплатную доставку, профессиональный монтаж и гарантию
					на весь ассортимент.
				</p>
			</div>
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
		</section>
	)
}
