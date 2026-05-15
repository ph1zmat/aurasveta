'use client'

import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'
import { useSeoHealth } from '../_hooks/use-seo-health'

export function SeoHistoryTab() {
	const { history, isHistoryLoading } = useSeoHealth()

	return (
		<div className='space-y-2'>
			{isHistoryLoading ? (
				<div className='flex items-center justify-center py-6'>
					<Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
				</div>
			) : history && history.items.length > 0 ? (
				history.items.map((item) => (
					<div
						key={item.id}
						className='flex items-center gap-3 p-3 border rounded-lg hover:bg-secondary/20'
					>
						<Badge
							variant='secondary'
							className={
								item.status === 'COMPLETED'
									? 'bg-green-900/30 text-green-400'
									: 'bg-amber-900/30 text-amber-400'
							}
						>
							{item.status === 'COMPLETED' ? 'COMPLETED' : 'PARTIAL'}
						</Badge>
						<div className='flex-1 min-w-0'>
							<div className='text-sm font-medium'>Quick Fix — safe-overwrite</div>
							<div className='text-xs text-muted-foreground'>
								{new Date(item.createdAt).toLocaleDateString('ru-RU')}
							</div>
						</div>
						<div className='text-xs text-muted-foreground shrink-0'>
							+{item.titlesAdded} title, +{item.descriptionsAdded} desc
						</div>
					</div>
				))
			) : (
				<div className='text-sm text-muted-foreground py-6 text-center'>
					Пока нет истории исправлений. Нажмите «Исправить всё SEO» для первого запуска.
				</div>
			)}
		</div>
	)
}
