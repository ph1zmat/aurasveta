'use client'

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title?: string
	description?: string
	confirmText?: string
	cancelText?: string
	variant?: 'default' | 'destructive'
	onConfirm: () => void
}

/**
 * Переиспользуемый диалог подтверждения для всех операций удаления.
 * Обертка над shadcn Dialog с единым дизайном.
 */
export default function ConfirmDialog({
	open,
	onOpenChange,
	title = 'Подтвердите удаление',
	description = 'Это действие нельзя отменить. Вы уверены?',
	confirmText = 'Удалить',
	cancelText = 'Отмена',
	variant = 'destructive',
	onConfirm,
}: ConfirmDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className='max-w-sm'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						{cancelText}
					</Button>
					<Button
						variant={variant === 'destructive' ? 'destructive' : 'default'}
						onClick={() => {
							onConfirm()
							onOpenChange(false)
						}}
					>
						{confirmText}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
