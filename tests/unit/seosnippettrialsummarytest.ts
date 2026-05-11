import { describe, expect, it } from 'vitest'
import { buildSnippetTrialSummary } from '@/shared/lib/seo/snippettrialsummary'

describe('seo snippet trial summary helper', () => {
	it('считает counts и средний delta CTR по текущему срезу', () => {
		const summary = buildSnippetTrialSummary([
			{ mode: 'rule-scored', outcome: 'promote', deltaCtrPct: 12 },
			{ mode: 'rule-scored', outcome: 'keep-testing', deltaCtrPct: 4 },
			{ mode: 'hybrid', outcome: 'reject', deltaCtrPct: -3 },
			{ mode: 'hybrid', outcome: 'promote', deltaCtrPct: 8 },
		])

		expect(summary.total).toBe(4)
		expect(summary.promote).toBe(2)
		expect(summary.keepTesting).toBe(1)
		expect(summary.reject).toBe(1)
		expect(summary.avgDeltaCtrPct).toBeCloseTo(5.25, 4)
	})

	it('определяет best mode только по promote-метрикам', () => {
		const summary = buildSnippetTrialSummary([
			{ mode: 'rule-scored', outcome: 'promote', deltaCtrPct: 9 },
			{ mode: 'rule-scored', outcome: 'promote', deltaCtrPct: 11 },
			{ mode: 'hybrid', outcome: 'promote', deltaCtrPct: 6 },
			{ mode: 'hybrid', outcome: 'keep-testing', deltaCtrPct: 20 },
		])

		expect(summary.bestMode).toBe('rule-scored')
		expect(summary.bestModeAvgDeltaCtr).toBeCloseTo(10, 4)
	})
})
