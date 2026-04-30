'use client'

import FileUploader from '@/shared/ui/FileUploader'

interface MediaPickerProps {
	label?: string
	value?: string | null
	onChange: (value: string | null, originalName?: string | null) => void
	aspectRatio?: 'square' | 'landscape' | 'portrait'
	helperText?: string
	compact?: boolean
	hideLabel?: boolean
	isLoading?: boolean
}

export function MediaPicker({
	label = 'Изображение',
	value,
	onChange,
	aspectRatio = 'landscape',
	helperText,
	compact,
	hideLabel,
	isLoading,
}: MediaPickerProps) {
	return (
		<FileUploader
			label={label}
			currentImage={value ?? null}
			onUploaded={(key, originalName) => onChange(key, originalName)}
			onRemove={() => onChange(null, null)}
			aspectRatio={aspectRatio}
			helperText={helperText}
			compact={compact}
			hideLabel={hideLabel}
			isLoading={isLoading}
		/>
	)
}
