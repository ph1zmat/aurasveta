'use client'

import { Check, Circle } from 'lucide-react'

const STEPS = [
{ key: 'PENDING', label: 'Новый' },
{ key: 'PAID', label: 'Оплачен' },
{ key: 'SHIPPED', label: 'Отправлен' },
{ key: 'DELIVERED', label: 'Доставлен' },
]

interface OrderTimelineProps {
currentStatus: string
}

export function OrderTimeline({ currentStatus }: OrderTimelineProps) {
const currentIdx = STEPS.findIndex((s) => s.key === currentStatus)

return (
<div className='flex items-center gap-0'>
{STEPS.map((step, i) => {
const isDone = i < currentIdx
const isCurrent = i === currentIdx
return (
<div key={step.key} className='flex items-center flex-1 last:flex-none'>
<div className='flex flex-col items-center gap-1'>
<div
className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
isDone
? 'bg-success text-success-foreground'
: isCurrent
? 'bg-accent text-accent-foreground'
: 'bg-secondary text-muted-foreground'
}`}
>
{isDone ? (
<Check className='h-4 w-4' />
) : isCurrent ? (
<Circle className='h-4 w-4 animate-pulse' />
) : (
<Circle className='h-4 w-4 opacity-40' />
)}
</div>
<span
className={`text-[10px] font-medium whitespace-nowrap ${
isDone
? 'text-success'
: isCurrent
? 'text-accent'
: 'text-muted-foreground'
}`}
>
{step.label}
</span>
</div>
{i < STEPS.length - 1 && (
<div
className={`flex-1 h-0.5 mx-1 rounded-full mb-4 ${isDone ? 'bg-success' : 'bg-border'}`}
/>
)}
</div>
)
})}
</div>
)
}
