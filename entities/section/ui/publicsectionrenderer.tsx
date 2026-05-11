import { cn } from '@/shared/lib/utils'
import { getSectionDefinition, type ResolvedSectionRecord } from '../registry'

function getBackgroundStyle(section: ResolvedSectionRecord) {
	const background = section.background
	if (!background) return { className: undefined, style: undefined }

	if (background.type === 'color') {
		return {
			className: undefined,
			style: { backgroundColor: background.value },
		}
	}

	if (background.type === 'gradient') {
		return {
			className: undefined,
			style: { backgroundImage: background.value },
		}
	}

	if (background.type === 'image') {
		const image = section.mediaItems.find(
			item => item.id === background.mediaAssetId,
		)

		if (image) {
			return {
				className: 'bg-cover bg-center bg-no-repeat',
				style: {
					backgroundImage: `linear-gradient(rgba(0,0,0,${background.overlay}), rgba(0,0,0,${background.overlay})), url(${image.url})`,
				},
			}
		}
	}

	return { className: undefined, style: undefined }
}

export default function PublicSectionRenderer({
	section,
	className,
}: {
	section: ResolvedSectionRecord
	className?: string
}) {
	const definition = getSectionDefinition(section.type)
	const { className: backgroundClassName, style } = getBackgroundStyle(section)

	return (
		<div
			id={section.anchor ?? undefined}
			className={cn(backgroundClassName, className)}
			style={style}
		>
			<definition.RendererComponent
				definition={definition as never}
				section={section as never}
				title={section.title}
				subtitle={section.subtitle}
				config={section.config as never}
			/>
		</div>
	)
}
