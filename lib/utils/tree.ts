export interface TreeNodeLike<TNode extends TreeNodeLike<TNode>> {
	id: string
	children?: TNode[] | null
}

/**
 * Ищет узел по id в дереве произвольной глубины.
 */
export function findNodeInTree<TNode extends TreeNodeLike<TNode>>(
	nodes: TNode[],
	id: string,
): TNode | null {
	for (const node of nodes) {
		if (node.id === id) return node
		if (node.children?.length) {
			const found = findNodeInTree(node.children, id)
			if (found) return found
		}
	}

	return null
}