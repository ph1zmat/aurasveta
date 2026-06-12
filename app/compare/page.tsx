import CompareContent from './comparecontent'

export const metadata = {
	title: 'Сравнение — Аура Света',
	robots: { index: false, follow: true },
}

export default function ComparePage() {
	return (
		<div className='flex flex-col bg-background'>
			<main className='mobile-page-padding mobile-edge-padding min-h-screen flex-1 container mx-auto max-w-7xl'>
				<CompareContent />
			</main>
		</div>
	)
}
