'use client'

import { useState } from 'react'

interface ViewToggleProps {
	defaultView?: 'products' | 'collections'
}

export default function ViewToggle({
	defaultView = 'products',
}: ViewToggleProps) {
	const [view, setView] = useState(defaultView)

	return (
		<div className='flex items-center gap-2 text-sm'>
			<span
				className={
					view === 'products'
						? 'font-medium text-foreground'
						: 'text-muted-foreground cursor-pointer'
				}
				onClick={() => setView('products')}
			>
				Товар
			</span>
			<button
				onClick={() =>
					setView(view === 'products' ? 'collections' : 'products')
				}
				className='relative h-5 w-10 rounded-full bg-foreground transition-colors'
				aria-label='Переключить вид'
			>
				<span
					className={`absolute top-0.5 h-4 w-4 rounded-full bg-card transition-transform ${
						view === 'collections' ? 'translate-x-5' : 'translate-x-0.5'
					}`}
				/>
			</button>
			<span
				className={
					view === 'collections'
						? 'font-medium text-foreground'
						: 'text-muted-foreground cursor-pointer'
				}
				onClick={() => setView('collections')}
			>
				Коллекции
			</span>
		</div>
	)
}
