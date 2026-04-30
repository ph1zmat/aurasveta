'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	FormCheckbox,
	FormInput,
	FormSection,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { Home, Pencil } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import {
	PageSectionsEditor,
	toPageSectionDraft,
	type PageSectionDraft,
} from '@/features/admin/page-sections'
import { NLButton } from '../components/ui/button'

function toPageSectionPayload(section: PageSectionDraft) {
	return {
		type: section.type,
		title: section.title.trim() || null,
		subtitle: section.subtitle.trim() || null,
		anchor: section.anchor.trim() || null,
		isActive: section.isActive,
		background: section.background,
		config: section.config as Record<string, unknown>,
		manualProductIds: section.manualProductIds,
		manualCategoryIds: section.manualCategoryIds,
		mediaItems: section.mediaItems,
	}
}

type HomeDraftState = {
	title: string
	isPublished: boolean
	sections: PageSectionDraft[]
}

function HomeSectionsEditorContent({
	homePageId,
	initialState,
	onSave,
	isSaving,
}: {
	homePageId: string | null
	initialState: HomeDraftState
	onSave: (value: HomeDraftState) => Promise<void>
	isSaving: boolean
}) {
	const router = useRouter()
	const [title, setTitle] = useState(initialState.title)
	const [isPublished, setIsPublished] = useState(initialState.isPublished)
	const [sections, setSections] = useState(initialState.sections)
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const confirmDiscard = useUnsavedChangesGuard(hasUnsavedChanges)

	function markDirty() {
		setHasUnsavedChanges(true)
		setSubmitError(null)
	}

	async function handleSave() {
		if (!title.trim()) {
			setSubmitError('Введите заголовок главной страницы.')
			return
		}

		setSubmitError(null)

		try {
			await onSave({
				title: title.trim(),
				isPublished,
				sections,
			})
			setHasUnsavedChanges(false)
		} catch (error) {
			setSubmitError(
				error instanceof Error && error.message.trim()
					? error.message
					: 'Не удалось сохранить главную страницу.',
			)
		}
	}

	function openFullPageEditor() {
		if (!homePageId) return
		router.push(`/admin/pages?edit=${homePageId}`)
	}

	function resetDraft() {
		if (!confirmDiscard()) return

		setTitle(initialState.title)
		setIsPublished(initialState.isPublished)
		setSections(initialState.sections)
		setHasUnsavedChanges(false)
		setSubmitError(null)
	}

	return (
		<div className='space-y-6'>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<div className='flex items-center gap-3'>
					<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-muted'>
						<Home className='h-5 w-5 text-(--nl-accent)' />
					</div>
					<div>
						<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
							Главная страница
						</h1>
						<p className='mt-1 text-xs text-muted-foreground'>
							Единый редактор секций для публичной страницы `/`.
						</p>
					</div>
				</div>

				<div className='flex flex-wrap gap-2'>
					{homePageId ? (
						<NLButton
							type='button'
							variant='outline'
							onClick={openFullPageEditor}
						>
							<Pencil className='mr-1.5 h-4 w-4' /> Открыть карточку страницы
						</NLButton>
					) : null}
					<NLButton type='button' variant='outline' onClick={resetDraft}>
						Сбросить
					</NLButton>
					<NLButton
						type='button'
						onClick={() => {
							void handleSave()
						}}
						disabled={isSaving}
					>
						{isSaving ? 'Сохранение...' : 'Сохранить главную'}
					</NLButton>
				</div>
			</div>

			{submitError ? (
				<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
					{submitError}
				</div>
			) : null}

			<div className='grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]'>
				<div className='space-y-4'>
					<FormSection
						title='Параметры HOME'
						description='Управляйте заголовком и статусом публикации главной страницы.'
					>
						<FormInput
							id='home-title'
							label='Заголовок'
							value={title}
							onChange={event => {
								markDirty()
								setTitle(event.target.value)
							}}
							placeholder='Главная'
						/>

						<FormCheckbox
							variant='card'
							checked={isPublished}
							onChange={checked => {
								markDirty()
								setIsPublished(checked)
							}}
							label='Опубликовать HOME'
							description='После сохранения эти секции будут использованы публичной главной страницей.'
						/>
					</FormSection>
				</div>

				<FormSection
					title='Секции главной'
					description='Настройте состав и порядок блоков для главной страницы.'
				>
					<PageSectionsEditor
						value={sections}
						onChange={next => {
							markDirty()
							setSections(next)
						}}
					/>
				</FormSection>
			</div>
		</div>
	)
}

export default function HomeSectionsClient() {
	const utils = trpc.useUtils()
	const { data: homePage, isLoading: isHomePageLoading } =
		trpc.pages.getHomePage.useQuery()
	const { data: homePageDetails, isLoading: isHomePageDetailsLoading } =
		trpc.pages.getById.useQuery(homePage?.id ?? '', {
			enabled: Boolean(homePage?.id),
		})
	const upsertHomePageMut = trpc.pages.upsertHomePageSections.useMutation({
		onSuccess: async () => {
			await Promise.all([
				utils.pages.getHomePage.invalidate(),
				utils.pages.getAll.invalidate(),
				utils.pages.getAdminList.invalidate(),
				homePage?.id
					? utils.pages.getById.invalidate(homePage.id)
					: Promise.resolve(),
			])
		},
	})

	const bootstrapSections = useMemo(() => {
		const unifiedSections =
			(homePageDetails?.sections ?? [])
				.map(section => toPageSectionDraft(section))
				.filter((section): section is PageSectionDraft => section !== null) ??
			[]

		return unifiedSections
	}, [homePageDetails])

	const isLoading = isHomePageLoading || isHomePageDetailsLoading

	if (isLoading) {
		return (
			<div className='rounded-2xl border border-border bg-background p-6 text-sm text-muted-foreground'>
				Загрузка главной страницы...
			</div>
		)
	}

	const initialState: HomeDraftState = {
		title: homePageDetails?.title ?? homePage?.title ?? 'Главная',
		isPublished: homePageDetails?.isPublished ?? homePage?.isPublished ?? false,
		sections: bootstrapSections,
	}
	const editorKey = JSON.stringify({
		id: homePage?.id ?? 'new',
		title: initialState.title,
		isPublished: initialState.isPublished,
		sections: initialState.sections.map(section => section.id),
	})

	return (
		<HomeSectionsEditorContent
			key={editorKey}
			homePageId={homePage?.id ?? null}
			initialState={initialState}
			onSave={async value => {
				await upsertHomePageMut.mutateAsync({
					title: value.title,
					isPublished: value.isPublished,
					sections: value.sections.map(toPageSectionPayload),
				})
			}}
			isSaving={upsertHomePageMut.isPending}
		/>
	)
}
