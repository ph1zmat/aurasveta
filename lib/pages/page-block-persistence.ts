import 'server-only'

import type { Prisma } from '@prisma/client'
import type { PageBlockSaveItem } from '@/shared/types/page-builder'

export async function replacePageBlocks(
	tx: Prisma.TransactionClient,
	pageId: string,
	blocks: PageBlockSaveItem[],
): Promise<void> {
	await tx.pageBlock.deleteMany({ where: { pageId } })

	if (blocks.length === 0) return

	await tx.pageBlock.createMany({
		data: blocks.map((block, index) => ({
			pageId,
			type: block.type,
			order: index,
			isActive: block.isActive ?? true,
			config: block.config as Prisma.InputJsonValue,
		})),
	})
}

export function pageBlocksToSnapshot(blocks: PageBlockSaveItem[]): Prisma.InputJsonValue {
	return blocks.map((block, index) => ({
		type: block.type,
		order: index,
		isActive: block.isActive ?? true,
		config: block.config,
	})) as Prisma.InputJsonValue
}
