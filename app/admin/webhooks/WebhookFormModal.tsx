'use client'

import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
	FormInput,
	FormSection,
	useUnsavedChangesGuard,
} from '@aurasveta/shared-admin'
import { CheckCircle2, Zap } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { Button } from '@/shared/ui/Button'
import AdminModal from '@/shared/ui/AdminModal'
import { validateWebhookUrl } from '@/shared/lib/validateUrl'
import { EVENT_COLORS, EVENTS } from './webhook-config'

type WebhookEvent = (typeof EVENTS)[number]

type WebhookFormValue = {
	url: string
	events: WebhookEvent[]
}

function getSubmitError(value: WebhookFormValue) {
	if (!value.url.trim()) return 'Введите URL вебхука.'

	const validation = validateWebhookUrl(value.url.trim())
	if (!validation.valid) {
		return validation.reason ?? 'Невалидный URL вебхука.'
	}

	if (value.events.length === 0) {
		return 'Выберите хотя бы одно событие для вебхука.'
	}

	return null
}

function getMutationErrorMessage(error: unknown) {
	if (error instanceof Error && error.message.trim()) {
		return error.message
	}

	return 'Не удалось создать вебхук. Проверьте поля формы и попробуйте снова.'
}

export default function WebhookFormModal({
	onClose,
	onSuccess,
}: {
	onClose: () => void
	onSuccess: () => void | Promise<void>
}) {
	const createMut = trpc.webhooks.create.useMutation()
	const [submitError, setSubmitError] = useState<string | null>(null)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	const form = useForm({
		defaultValues: {
			url: '',
			events: [] as WebhookEvent[],
		},
		onSubmitInvalid: ({ value }) => {
			setSubmitError(
				getSubmitError(value) ??
					'Проверьте URL и выбранные события перед сохранением.',
			)
		},
		onSubmit: async ({ value }) => {
			const validationError = getSubmitError(value)
			if (validationError) {
				setSubmitError(validationError)
				return
			}

			setSubmitError(null)

			try {
				await createMut.mutateAsync({
					url: value.url.trim(),
					events: value.events,
				})
				setHasUnsavedChanges(false)
				await onSuccess()
			} catch (error) {
				setSubmitError(getMutationErrorMessage(error))
			}
		},
	})

	const confirmDiscard = useUnsavedChangesGuard(hasUnsavedChanges)
	const safeClose = () => {
		if (confirmDiscard()) onClose()
	}
	const markDirty = () => {
		setHasUnsavedChanges(true)
		setSubmitError(null)
	}

	const toggleEvent = (eventName: WebhookEvent) => {
		markDirty()
		const currentEvents = form.state.values.events
		const nextEvents = currentEvents.includes(eventName)
			? currentEvents.filter(item => item !== eventName)
			: [...currentEvents, eventName]
		form.setFieldValue('events', nextEvents)
	}

	const formId = 'webhook-form-modal'

	return (
		<AdminModal
			isOpen
			onClose={safeClose}
			title='Новый вебхук'
			size='sm'
			footer={[
				<Button key='cancel' variant='ghost' type='button' onClick={safeClose}>
					Отмена
				</Button>,
				<form.Subscribe key='submit' selector={state => state.isSubmitting}>
					{isSubmitting => (
						<Button
							type='submit'
							form={formId}
							disabled={isSubmitting || form.state.values.events.length === 0}
						>
							{isSubmitting ? 'Создание...' : 'Создать'}
						</Button>
					)}
				</form.Subscribe>,
			]}
		>
			<form
				id={formId}
				onSubmit={event => {
					event.preventDefault()
					void form.handleSubmit()
				}}
				className='space-y-5 px-6 py-5'
			>
				{submitError ? (
					<div className='rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
						{submitError}
					</div>
				) : null}

				<form.Field
					name='url'
					validators={{
						onBlur: ({ value }) => {
							if (!value.trim()) return 'Введите URL вебхука.'
							const result = validateWebhookUrl(value.trim())
							return result.valid ? undefined : result.reason
						},
					}}
				>
					{field => (
						<FormInput
							id='webhook-url'
							label='URL вебхука'
							required
							error={
								field.state.meta.isTouched
									? ((field.state.meta.errors[0] as string | undefined) ?? null)
									: null
							}
							hint='Разрешены только внешние HTTP/HTTPS адреса без localhost и приватных IP.'
							value={field.state.value}
							onChange={event => {
								markDirty()
								field.handleChange(event.target.value)
							}}
							onBlur={field.handleBlur}
							placeholder='https://example.com/webhook'
							type='url'
							inputClassName='font-mono'
						/>
					)}
				</form.Field>

				<FormSection
					title='События'
					description='Выберите, на какие бизнес-события должен подписаться этот webhook endpoint.'
				>
					<div className='space-y-2'>
						{EVENTS.map(eventName => {
							const color = EVENT_COLORS[eventName]
							const checked = form.state.values.events.includes(eventName)

							return (
								<button
									key={eventName}
									type='button'
									onClick={() => toggleEvent(eventName)}
									className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
										checked
											? `border-primary/30 ${color.bg}`
											: 'border-border bg-background/70 hover:bg-muted/20'
									}`}
								>
									<div
										className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
											checked
												? 'border-primary bg-primary'
												: 'border-muted-foreground/30'
										}`}
									>
										{checked ? (
											<CheckCircle2 className='h-3 w-3 text-primary-foreground' />
										) : null}
									</div>
									<div className='min-w-0 flex-1'>
										<div
											className={`text-sm font-medium ${checked ? color.color : 'text-foreground'}`}
										>
											{eventName}
										</div>
										<div className='text-xs text-muted-foreground'>
											{eventName.startsWith('product')
												? 'Триггерится при изменениях товарного каталога.'
												: 'Триггерится при изменениях заказов и статусов.'}
										</div>
									</div>
									<div className='rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground'>
										<Zap className='h-3.5 w-3.5' />
									</div>
								</button>
							)
						})}
					</div>
				</FormSection>
			</form>
		</AdminModal>
	)
}
