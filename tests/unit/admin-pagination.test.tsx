import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import AdminPagination from '@/app/admin/components/AdminPagination'

describe('AdminPagination', () => {
	it('renders page numbers with ellipsis for many pages', () => {
		render(
			<AdminPagination
				page={5}
				totalPages={50}
				limit={20}
				onPageChange={vi.fn()}
				onLimitChange={vi.fn()}
				total={1000}
			/>
		)

		expect(screen.getByText('1')).toBeInTheDocument()
		expect(screen.getByText('50')).toBeInTheDocument()
		expect(screen.getByText('5')).toBeInTheDocument()
		expect(screen.getAllByText('...').length).toBeGreaterThanOrEqual(1)
	})

	it('calls onPageChange when clicking a page number', () => {
		const onPageChange = vi.fn()
		render(
			<AdminPagination
				page={1}
				totalPages={5}
				limit={20}
				onPageChange={onPageChange}
			/>
		)

		fireEvent.click(screen.getByText('3'))
		expect(onPageChange).toHaveBeenCalledWith(3)
	})

	it('jumps to page when entering number and clicking Перейти', () => {
		const onPageChange = vi.fn()
		render(
			<AdminPagination
				page={1}
				totalPages={20}
				limit={20}
				onPageChange={onPageChange}
			/>
		)

		const input = screen.getByPlaceholderText('#')
		fireEvent.change(input, { target: { value: '15' } })
		fireEvent.click(screen.getByText('Перейти'))
		expect(onPageChange).toHaveBeenCalledWith(15)
	})

	it('calls onLimitChange when clicking limit buttons', () => {
		const onLimitChange = vi.fn()
		render(
			<AdminPagination
				page={1}
				totalPages={10}
				limit={20}
				onPageChange={vi.fn()}
				onLimitChange={onLimitChange}
			/>
		)

		fireEvent.click(screen.getByText('50'))
		expect(onLimitChange).toHaveBeenCalledWith(50)
	})

	it('disables prev button on first page', () => {
		render(
			<AdminPagination
				page={1}
				totalPages={5}
				limit={20}
				onPageChange={vi.fn()}
			/>
		)

		const prevButtons = screen.getAllByLabelText(/предыдущая|первая/i)
		prevButtons.forEach((btn) => {
			expect(btn).toBeDisabled()
		})
	})
})
