'use client'

import { trpc } from '@/lib/trpc/client'
import { findNodeInTree } from '@/lib/utils/tree'
import OriginalCategoryFormModal from './components/CategoryFormModal'

interface CategoryFormModalProps {
	editId: string | null
	parentId: string | null
	onClose: () => void
	onSuccess: () => void
}

export default function CategoryFormModal({
	editId,
	parentId,
	onClose,
	onSuccess,
}: CategoryFormModalProps) {
	const { data: tree } = trpc.categories.getTree.useQuery(undefined, {
		enabled: editId !== null,
	})

	const category = editId && tree ? findNodeInTree(tree, editId) : null

	// When creating a child category, pre-set parentId via partial category shape
	const categoryData = category ?? (parentId ? { parentId } : undefined)

	return (
		<OriginalCategoryFormModal
			open
			onOpenChange={open => {
				if (!open) onClose()
			}}
			onSuccess={() => {
				onSuccess()
				onClose()
			}}
			category={categoryData}
		/>
	)
}
