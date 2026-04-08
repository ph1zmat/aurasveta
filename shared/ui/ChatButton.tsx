'use client'

import { MessageCircle } from 'lucide-react'

export default function ChatButton() {
	return (
		<button
			className='fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-card shadow-lg transition-transform hover:scale-105 md:bottom-6 md:right-6 md:h-14 md:w-14'
			aria-label='Открыть чат'
		>
			<MessageCircle className='h-6 w-6' />
		</button>
	)
}
