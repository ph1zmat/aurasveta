import { renderHomeSection } from '@/lib/component-registry'
import type { RegistrySectionData } from '@/lib/component-registry'

interface SectionData extends RegistrySectionData {
	isActive: boolean
	order: number
}

export default function DynamicSection({ section }: { section: SectionData }) {
	return renderHomeSection(section)
}
