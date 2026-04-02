'use client'

import { useState } from 'react'

export default function CouponForm() {
	const [code, setCode] = useState('')

	return (
		<div className='mt-6 rounded-sm border border-border bg-card p-6'>
			<label className='mb-3 block text-sm font-medium text-foreground'>
				Введите код купона для скидки:
			</label>
			<input
				type='text'
				value={code}
				onChange={e => setCode(e.target.value)}
				className='mb-4 block w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-ring'
			/>
			<button className='w-full rounded-sm border border-foreground py-2.5 text-xs font-medium uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-card'>
				Применить
			</button>
		</div>
	)
}
