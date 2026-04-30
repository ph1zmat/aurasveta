import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import ConfirmDialog from '@/app/admin/components/ConfirmDialog'

describe('ConfirmDialog', () => {
	it('renders title and description when open', () => {
		render(
			<ConfirmDialog
				open={true}
				onOpenChange={vi.fn()}
				title='Удалить товар?'
				description='Это необратимо.'
				onConfirm={vi.fn()}
			/>
		)

		expect(screen.getByText('Удалить товар?')).toBeInTheDocument()
		expect(screen.getByText('Это необратимо.')).toBeInTheDocument()
	})

	it('calls onConfirm when clicking Удалить', () => {
		const onConfirm = vi.fn()
		const onOpenChange = vi.fn()
		render(
			<ConfirmDialog
				open={true}
				onOpenChange={onOpenChange}
				onConfirm={onConfirm}
			/>
		)

		fireEvent.click(screen.getByText('Удалить'))
		expect(onConfirm).toHaveBeenCalledTimes(1)
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('calls onOpenChange(false) when clicking Отмена', () => {
		const onOpenChange = vi.fn()
		render(
			<ConfirmDialog
				open={true}
				onOpenChange={onOpenChange}
				onConfirm={vi.fn()}
			/>
		)

		fireEvent.click(screen.getByText('Отмена'))
		expect(onOpenChange).toHaveBeenCalledWith(false)
	})

	it('does not render when closed', () => {
		render(
			<ConfirmDialog
				open={false}
				onOpenChange={vi.fn()}
				onConfirm={vi.fn()}
			/>
		)

		expect(screen.queryByText('Подтвердите удаление')).not.toBeInTheDocument()
	})
})
