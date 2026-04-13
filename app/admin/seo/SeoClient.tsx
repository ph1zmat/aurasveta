'use client'

import { trpc } from '@/lib/trpc/client'
import SeoForm from './SeoForm'

const STATIC_PAGES = [{ id: 'home', label: 'Главная страница' }]

export default function SeoClient() {
	const { data: pages } = trpc.pages.getAll.useQuery()
	const { data: categories } = trpc.categories.getTree.useQuery()

	return (
		<div className='space-y-8'>
			<h1 className='text-xl font-semibold uppercase tracking-widest'>
				SEO настройки
			</h1>

			<section className='space-y-4'>
				<h2 className='text-lg font-medium'>Статические страницы</h2>
				{STATIC_PAGES.map(page => (
					<div key={page.id}>
						<p className='mb-2 text-sm font-medium'>{page.label}</p>
						<SeoForm targetType='page' targetId={page.id} />
					</div>
				))}
			</section>

			{pages && pages.length > 0 && (
				<section className='space-y-4'>
					<h2 className='text-lg font-medium'>CMS Страницы</h2>
					{pages.map((page: { id: string; title: string }) => (
						<div key={page.id}>
							<p className='mb-2 text-sm font-medium'>{page.title}</p>
							<SeoForm targetType='page' targetId={page.id} />
						</div>
					))}
				</section>
			)}

			{categories && categories.length > 0 && (
				<section className='space-y-4'>
					<h2 className='text-lg font-medium'>Категории</h2>
					{categories.map((cat: { id: string; name: string }) => (
						<div key={cat.id}>
							<p className='mb-2 text-sm font-medium'>{cat.name}</p>
							<SeoForm targetType='category' targetId={cat.id} />
						</div>
					))}
				</section>
			)}
		</div>
	)
}

