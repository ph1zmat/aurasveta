'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'

export interface AdminModalProps {
	isOpen: boolean
	onClose: () => void
	title: React.ReactNode
	children: React.ReactNode
	footer?: React.ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl'
	scrollable?: boolean
	closeOnOverlayClick?: boolean
	className?: string
	bodyClassName?: string
}

const modalSizes = {
	sm: 'max-w-md',
	md: 'max-w-xl',
	lg: 'max-w-2xl',
	xl: 'max-w-4xl',
} as const

/**
 * Базовый контейнер для админских модалок с единым overlay, header и footer.
 */
export default function AdminModal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size = 'md',
	scrollable = false,
	closeOnOverlayClick = true,
	className,
	bodyClassName,
}: AdminModalProps) {
	useEffect(() => {
		if (!isOpen) return

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose()
		}

		window.addEventListener('keydown', handleEscape)
		return () => window.removeEventListener('keydown', handleEscape)
	}, [isOpen, onClose])

	if (!isOpen) return null

	return (
		<div
			className='fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm h-full overflow-y-hidden'
			onClick={closeOnOverlayClick ? onClose : undefined}
		>
			<div
				className={cn(
					'flex w-full flex-col rounded-2xl border border-border bg-card shadow-2xl',
					modalSizes[size],
					scrollable && 'max-h-[90vh]',
					className,
				)}
				onClick={event => event.stopPropagation()}
			>
				<div className='flex items-center justify-between border-b border-border px-6 py-4'>
					<div className='text-lg font-semibold text-foreground'>{title}</div>
					<button
						type='button'
						onClick={onClose}
						className='rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
						aria-label='Закрыть окно'
					>
						<X className='h-5 w-5' />
					</button>
				</div>

				<div className={cn(scrollable && 'overflow-y-auto', bodyClassName)}>
					{children}
				</div>

				{footer ? (
					<div className='flex justify-end gap-2 border-t border-border px-6 py-4'>
						{footer}
					</div>
				) : null}
			</div>
		</div>
	)
}
