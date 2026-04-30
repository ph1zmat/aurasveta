'use client'

import { Plus, Trash2 } from 'lucide-react'
import { FormCheckbox, FormInput, FormSelect } from '@aurasveta/shared-admin'
import { MediaPicker } from '@/shared/ui'
import { Button } from '@/shared/ui/Button'
import type { PageSectionConfigEditorProps } from '../../model/sectionEditorRegistry'

export default function GallerySectionEditor({
	value,
	onChange,
	onSectionChange,
	section,
}: PageSectionConfigEditorProps<'gallery'>) {
	return (
		<div className='space-y-4'>
			<div className='grid gap-4 md:grid-cols-3'>
				<FormSelect label='Layout' value={value.layout} onChange={event => onChange({ ...value, layout: event.target.value as typeof value.layout })}>
					<option value='grid'>Grid</option>
					<option value='masonry'>Masonry</option>
					<option value='carousel'>Carousel</option>
				</FormSelect>
				<FormSelect label='Aspect ratio' value={value.aspectRatio} onChange={event => onChange({ ...value, aspectRatio: event.target.value as typeof value.aspectRatio })}>
					<option value='1:1'>1:1</option>
					<option value='4:3'>4:3</option>
					<option value='3:4'>3:4</option>
					<option value='16:9'>16:9</option>
				</FormSelect>
				<FormCheckbox
					variant='card'
					checked={value.lightbox}
					onChange={checked => onChange({ ...value, lightbox: checked })}
					label='Lightbox'
					description='Пока влияет только на конфиг и будущие интеракции.'
				/>
			</div>
			<div className='space-y-3'>
				{section.mediaItems.map((item, index) => (
					<div key={`${item.storageKey}:${index}`} className='grid gap-4 rounded-2xl border border-border/70 bg-muted/10 p-4 lg:grid-cols-[220px_minmax(0,1fr)_auto]'>
						<MediaPicker
							label={`Изображение #${index + 1}`}
							value={item.storageKey}
							onChange={(storageKey, originalName) =>
								onSectionChange({
									mediaItems: section.mediaItems
										.map((media, mediaIndex) =>
											mediaIndex === index
												? {
													...media,
													storageKey: storageKey ?? '',
													originalName: originalName ?? null,
												}
												: media,
										)
										.filter(media => media.storageKey),
								})
							}
						/>
						<div className='space-y-3'>
							<FormInput label='Alt' value={item.alt ?? ''} onChange={event => onSectionChange({ mediaItems: section.mediaItems.map((media, mediaIndex) => mediaIndex === index ? { ...media, alt: event.target.value } : media) })} />
							<FormInput label='Role' value={item.role ?? ''} onChange={event => onSectionChange({ mediaItems: section.mediaItems.map((media, mediaIndex) => mediaIndex === index ? { ...media, role: event.target.value } : media) })} placeholder='gallery-image' />
						</div>
						<Button type='button' variant='ghost' size='sm' onClick={() => onSectionChange({ mediaItems: section.mediaItems.filter((_, mediaIndex) => mediaIndex !== index) })}>
							<Trash2 className='mr-1 h-4 w-4' /> Удалить
						</Button>
					</div>
				))}
				<Button type='button' variant='ghost' size='sm' onClick={() => onSectionChange({ mediaItems: [...section.mediaItems, { storageKey: '', originalName: null, alt: '', role: 'gallery-image' }] })}>
					<Plus className='mr-1 h-4 w-4' /> Добавить изображение
				</Button>
			</div>
		</div>
	)
}
