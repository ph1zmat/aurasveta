import { z } from 'zod'

// ─── Типы блоков ───────────────────────────────────────────────────────────

export const PAGE_BLOCK_TYPES = [
	'heading',
	'paragraph',
	'table',
	'image',
	'link',
	'icon-link',
] as const

export type PageBlockType = (typeof PAGE_BLOCK_TYPES)[number]

// ─── Конфиги блоков ────────────────────────────────────────────────────────

export const HeadingBlockConfigSchema = z.object({
	text: z.string().min(1, 'Текст заголовка обязателен'),
	level: z.enum(['h1', 'h2', 'h3', 'h4']).default('h2'),
})

export const ParagraphBlockConfigSchema = z.object({
	text: z.string().min(1, 'Текст абзаца обязателен'),
})

export const TableColumnSchema = z.object({
	key: z.string(),
	label: z.string(),
})

export const TableBlockConfigSchema = z.object({
	caption: z.string().optional(),
	columns: z.array(TableColumnSchema).min(1, 'Нужна хотя бы одна колонка'),
	rows: z.array(z.array(z.string())).min(1, 'Нужна хотя бы одна строка'),
})

export const ImageBlockConfigSchema = z.object({
	storageKey: z.string().min(1, 'Изображение обязательно'),
	alt: z.string().default(''),
	caption: z.string().optional(),
	alignment: z.enum(['left', 'center', 'right']).default('center'),
	widthMode: z.enum(['full', 'wide', 'normal', 'narrow']).default('normal'),
})

export const LinkBlockConfigSchema = z.object({
	label: z.string().min(1, 'Текст ссылки обязателен'),
	href: z.string().min(1, 'URL обязателен'),
	isExternal: z.boolean().default(false),
})

export const IconLinkBlockConfigSchema = z.object({
	label: z.string().min(1, 'Текст обязателен'),
	href: z.string().min(1, 'URL обязателен'),
	icon: z.string().min(1, 'Иконка обязательна'),
	description: z.string().optional(),
	isExternal: z.boolean().default(false),
})

// ─── Дискриминированный union всех блоков ──────────────────────────────────

export const PageBlockInputSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('heading'), config: HeadingBlockConfigSchema }),
	z.object({ type: z.literal('paragraph'), config: ParagraphBlockConfigSchema }),
	z.object({ type: z.literal('table'), config: TableBlockConfigSchema }),
	z.object({ type: z.literal('image'), config: ImageBlockConfigSchema }),
	z.object({ type: z.literal('link'), config: LinkBlockConfigSchema }),
	z.object({ type: z.literal('icon-link'), config: IconLinkBlockConfigSchema }),
])

export type PageBlockInput = z.infer<typeof PageBlockInputSchema>

// ─── Входной тип для сохранения в БД ──────────────────────────────────────

export const PageBlockSaveItemSchema = z.object({
	id: z.string().optional(),
	type: z.enum(PAGE_BLOCK_TYPES),
	isActive: z.boolean().default(true),
	config: z.record(z.string(), z.unknown()),
})

export type PageBlockSaveItem = z.infer<typeof PageBlockSaveItemSchema>

// ─── Draft-тип для UI редактора ────────────────────────────────────────────

export interface PageBlockDraft {
	draftId: string
	id?: string
	type: PageBlockType
	isActive: boolean
	config: Record<string, unknown>
}

// ─── Тип ответа из БД ──────────────────────────────────────────────────────

export interface PageBlockRecord {
	id: string
	type: string
	order: number
	isActive: boolean
	config: unknown
}

// ─── Метаданные блоков для UI ──────────────────────────────────────────────

export interface PageBlockMeta {
	type: PageBlockType
	label: string
	description: string
	icon: string
	defaultConfig: () => Record<string, unknown>
}

export const PAGE_BLOCK_META: Record<PageBlockType, PageBlockMeta> = {
	heading: {
		type: 'heading',
		label: 'Заголовок',
		description: 'H1–H4 заголовок',
		icon: 'Heading',
		defaultConfig: () => ({ text: '', level: 'h2' }),
	},
	paragraph: {
		type: 'paragraph',
		label: 'Абзац',
		description: 'Текстовый абзац',
		icon: 'AlignLeft',
		defaultConfig: () => ({ text: '' }),
	},
	table: {
		type: 'table',
		label: 'Таблица',
		description: 'Таблица с заголовками и строками',
		icon: 'Table',
		defaultConfig: () => ({
			caption: '',
			columns: [{ key: 'col1', label: 'Колонка 1' }],
			rows: [['']],
		}),
	},
	image: {
		type: 'image',
		label: 'Изображение',
		description: 'Изображение из хранилища',
		icon: 'Image',
		defaultConfig: () => ({
			storageKey: '',
			alt: '',
			caption: '',
			alignment: 'center',
			widthMode: 'normal',
		}),
	},
	link: {
		type: 'link',
		label: 'Ссылка',
		description: 'Текстовая ссылка или кнопка-ссылка',
		icon: 'Link',
		defaultConfig: () => ({ label: '', href: '', isExternal: false }),
	},
	'icon-link': {
		type: 'icon-link',
		label: 'Ссылка с иконкой',
		description: 'Ссылка с иконкой Lucide и описанием',
		icon: 'Sparkles',
		defaultConfig: () => ({
			label: '',
			href: '',
			icon: 'ArrowRight',
			description: '',
			isExternal: false,
		}),
	},
}
