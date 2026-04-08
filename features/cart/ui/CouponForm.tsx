'use client'

import { useState } from 'react'
import { Ticket } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Card } from '@/shared/ui/Card'

export default function CouponForm() {
	const [code, setCode] = useState('')

	return (
		<Card className='mt-6'>
			<label className='mb-3 flex items-center gap-2 text-sm font-normal text-foreground'>
				<Ticket className='h-4 w-4 text-muted-foreground' strokeWidth={1.5} />
				Введите код купона для скидки:
			</label>
			<div className='flex gap-2'>
				<Input
					value={code}
					onChange={e => setCode(e.target.value)}
					placeholder='Промокод'
				/>
				<Button variant='outline' size='xs' className='shrink-0'>
					Применить
				</Button>
			</div>
		</Card>
	)
}
