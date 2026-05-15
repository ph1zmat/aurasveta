'use client'

interface ScoreBadgeProps {
	score: number
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
	const color =
		score >= 80
			? 'bg-success/15 text-success'
			: score >= 50
				? 'bg-warning/15 text-warning'
				: 'bg-destructive/15 text-destructive'
	return (
		<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${color}`}>
			{score}
		</span>
	)
}

export function computeScore(item: {
	title?: string | null
	description?: string | null
	ogImage?: string | null
	noIndex?: boolean
}): number {
	let score = 100
	if (!item.title) score -= 25
	else if (item.title.length < 30 || item.title.length > 60) score -= 10
	if (!item.description) score -= 25
	else if (item.description.length < 70 || item.description.length > 160) score -= 10
	if (!item.ogImage) score -= 10
	return Math.max(0, score)
}
