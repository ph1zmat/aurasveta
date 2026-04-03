'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function CouponForm() {
	const [code, setCode] = useState('')

	return (
		<Card className='mt-6'>
			<label className='mb-3 block text-sm font-medium text-foreground'>
				Введите код купона для скидки:
			</label>
			<Input
				value={code}
				onChange={e => setCode(e.target.value)}
				className='mb-4'
			/>
			<Button variant='outline' size='xs' fullWidth>
				Применить
			</Button>
		</Card>
	)
}
