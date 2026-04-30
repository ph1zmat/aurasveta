export interface SectionEditorOption {
	id: string
	label: string
	description?: string
}

export interface SectionEditorOptions {
	pages: SectionEditorOption[]
	categories: SectionEditorOption[]
	products: SectionEditorOption[]
}
