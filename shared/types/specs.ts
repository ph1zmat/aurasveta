export interface SpecItem {
	label: string
	value: string
	tooltip?: boolean
}

export interface SpecRow {
	label: string
	value: string
	tooltip?: boolean
	href?: string
}

export interface SpecGroup {
	title: string
	rows: SpecRow[]
}

export interface CompareSpecRow {
	label: string
	values: (string | number | null)[]
}

export interface CompareSpecSection {
	title: string
	rows: CompareSpecRow[]
}
