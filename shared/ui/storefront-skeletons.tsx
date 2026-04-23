import type { ReactNode } from 'react'
import Skeleton from '@/shared/ui/Skeleton'

function DesktopStorefrontChromeSkeleton() {
	return (
		<>
			<div className='hidden md:block'>
				<div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-2'>
					<div className='flex items-center gap-4 lg:gap-6'>
						<Skeleton className='h-4 w-20' />
						<Skeleton className='h-4 w-28' />
						<Skeleton className='h-4 w-32' />
					</div>
					<div className='flex items-center gap-4 lg:gap-6'>
						<Skeleton className='h-4 w-40' />
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-4 w-28' />
					</div>
				</div>
			</div>

			<div className='hidden md:block mb-2'>
				<div className='mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 lg:gap-6'>
					<Skeleton className='h-12 w-40 rounded-md' />
					<Skeleton className='h-10 w-28 rounded-full' />
					<Skeleton className='h-11 flex-1 rounded-full' />
					<div className='flex items-center gap-4 lg:gap-6'>
						{Array.from({ length: 4 }).map((_, index) => (
							<div
								key={index}
								className='flex flex-col items-center gap-2'
							>
								<Skeleton className='h-6 w-6 rounded-full' />
								<Skeleton className='h-3 w-14' />
							</div>
						))}
					</div>
				</div>
			</div>

			<div className='hidden md:block border-y border-border'>
				<div className='mx-auto max-w-7xl px-4 py-2'>
					<div className='grid grid-cols-5 gap-3 lg:grid-cols-7'>
						{Array.from({ length: 7 }).map((_, index) => (
							<Skeleton key={index} className='h-6 rounded-none' />
						))}
					</div>
				</div>
			</div>
		</>
	)
}

function StorefrontShellSkeleton({ children }: { children: ReactNode }) {
	return (
		<div className='flex flex-col bg-background'>
			<main className='min-h-screen flex-1 container mx-auto max-w-7xl pb-16 md:pb-0'>
				<DesktopStorefrontChromeSkeleton />
				{children}
			</main>
		</div>
	)
}

function SectionHeadingSkeleton({
	titleWidth,
	subtitleWidth,
}: {
	titleWidth: string
	subtitleWidth?: string
}) {
	return (
		<div className='py-5 md:py-8'>
			<Skeleton className={`h-8 ${titleWidth} md:h-9`} />
			{subtitleWidth ? (
				<Skeleton className={`mt-3 h-4 ${subtitleWidth}`} />
			) : null}
		</div>
	)
	}

function ProductCardSkeleton() {
	return (
		<div className='rounded-2xl border border-border p-4 space-y-4'>
			<div className='flex items-center gap-2'>
				<Skeleton className='h-8 w-8 rounded-full' />
				<Skeleton className='h-8 w-8 rounded-full' />
				<Skeleton className='h-8 w-24 rounded-full' />
			</div>
			<Skeleton className='h-56 w-full rounded-2xl' />
			<div className='space-y-2'>
				<Skeleton className='h-4 w-4/5' />
				<Skeleton className='h-4 w-2/3' />
				<Skeleton className='h-3 w-1/3' />
			</div>
			<div className='flex items-center gap-2 flex-wrap'>
				<Skeleton className='h-6 w-24' />
				<Skeleton className='h-5 w-20 rounded-full' />
			</div>
			<div className='flex items-center gap-3'>
				<Skeleton className='h-9 w-32 rounded-md' />
				<Skeleton className='h-4 w-20' />
			</div>
		</div>
	)
}

function ProductGridSkeleton({
	count = 6,
	className = 'grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3',
}: {
	count?: number
	className?: string
}) {
	return (
		<div className={className}>
			{Array.from({ length: count }).map((_, index) => (
				<ProductCardSkeleton key={index} />
			))}
		</div>
	)
}

function CategoryRailSkeleton() {
	return (
		<div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6'>
			{Array.from({ length: 6 }).map((_, index) => (
				<div
					key={index}
					className='rounded-2xl border border-border p-4 space-y-3'
				>
					<Skeleton className='h-28 w-full rounded-2xl' />
					<Skeleton className='h-4 w-4/5' />
					<Skeleton className='h-3 w-1/2' />
				</div>
				))}
		</div>
	)
}

function SidebarSkeleton() {
	return (
		<div className='rounded-2xl border border-border p-4 space-y-5'>
			{Array.from({ length: 4 }).map((_, index) => (
				<div key={index} className='space-y-3'>
					<Skeleton className='h-4 w-28' />
					{Array.from({ length: 4 }).map((__, optionIndex) => (
						<Skeleton
							key={optionIndex}
							className='h-9 w-full rounded-xl'
						/>
					))}
				</div>
			))}
		</div>
	)
}

function CartItemSkeleton() {
	return (
		<div className='border-b border-border py-4 md:py-6'>
			<div className='flex items-start gap-3 md:gap-4'>
				<Skeleton className='h-20 w-16 shrink-0 rounded-xl md:h-24 md:w-20' />
				<div className='min-w-0 flex-1 space-y-3'>
					<Skeleton className='h-4 w-4/5' />
					<Skeleton className='h-3 w-1/2' />
					<div className='flex items-center justify-between gap-3 md:hidden'>
						<div className='flex items-center gap-2'>
							<Skeleton className='h-8 w-8 rounded-md' />
							<Skeleton className='h-8 w-8 rounded-md' />
							<Skeleton className='h-8 w-8 rounded-md' />
						</div>
						<div className='space-y-2 text-right'>
							<Skeleton className='ml-auto h-4 w-20' />
							<Skeleton className='ml-auto h-3 w-14' />
						</div>
					</div>
				</div>
				<div className='hidden shrink-0 items-center gap-2 md:flex'>
					<Skeleton className='h-8 w-8 rounded-md' />
					<Skeleton className='h-8 w-8 rounded-md' />
					<Skeleton className='h-8 w-8 rounded-md' />
				</div>
				<div className='hidden shrink-0 space-y-2 text-right md:block'>
					<Skeleton className='ml-auto h-4 w-20' />
					<Skeleton className='ml-auto h-3 w-14' />
				</div>
				<Skeleton className='h-8 w-8 shrink-0 rounded-md' />
			</div>
		</div>
	)
}

function CompareProductCardSkeleton() {
	return (
		<div className='space-y-3 rounded-2xl border border-border p-4'>
			<div className='flex items-center justify-end gap-2'>
				<Skeleton className='h-8 w-8 rounded-full' />
				<Skeleton className='h-8 w-8 rounded-full' />
			</div>
			<Skeleton className='h-40 w-full rounded-2xl' />
			<Skeleton className='h-4 w-4/5' />
			<Skeleton className='h-4 w-2/3' />
			<div className='space-y-2'>
				<Skeleton className='h-5 w-24' />
				<Skeleton className='h-4 w-20' />
			</div>
			<Skeleton className='h-10 w-full rounded-md' />
		</div>
	)
}

export function CatalogContentSkeleton() {
	return (
		<div className='space-y-10 pb-8'>
			<section className='space-y-4'>
				<CategoryRailSkeleton />
			</section>

			{Array.from({ length: 2 }).map((_, index) => (
				<section key={index} className='space-y-4'>
					<div className='flex items-center justify-between gap-4'>
						<Skeleton className='h-8 w-40' />
						<Skeleton className='h-9 w-28 rounded-md' />
					</div>
					<ProductGridSkeleton count={4} className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4' />
				</section>
			))}
		</div>
	)
}

export function CatalogPageSkeleton() {
	return (
		<StorefrontShellSkeleton>
			<SectionHeadingSkeleton titleWidth='w-40' subtitleWidth='w-72' />
			<CatalogContentSkeleton />
		</StorefrontShellSkeleton>
	)
}

export function CategoryContentSkeleton() {
	return (
		<div className='py-4 md:py-6'>
			<Skeleton className='mb-4 h-4 w-56' />

			<div className='flex gap-4 md:gap-8'>
				<div className='hidden w-64 shrink-0 lg:block'>
					<SidebarSkeleton />
				</div>

				<div className='min-w-0 flex-1 space-y-4'>
					<div className='flex items-start justify-between gap-4'>
						<div className='space-y-3'>
							<Skeleton className='h-8 w-40 md:h-9' />
							<Skeleton className='h-4 w-64' />
						</div>
						<Skeleton className='h-9 w-24 rounded-full' />
					</div>

					<div className='flex flex-wrap gap-2'>
						{Array.from({ length: 5 }).map((_, index) => (
							<Skeleton key={index} className='h-8 w-24 rounded-full' />
						))}
					</div>

					<div className='flex flex-col gap-2 sm:flex-row'>
						<Skeleton className='h-9 flex-1 rounded-lg' />
						<Skeleton className='h-9 w-24 rounded-md' />
						<Skeleton className='h-9 w-28 rounded-md' />
					</div>

					<Skeleton className='h-10 w-full rounded-xl' />
					<ProductGridSkeleton />

					<div className='flex justify-center gap-2 pt-2'>
						{Array.from({ length: 5 }).map((_, index) => (
							<Skeleton key={index} className='h-10 w-10 rounded-xl' />
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export function CategoryPageSkeleton() {
	return (
		<StorefrontShellSkeleton>
			<CategoryContentSkeleton />
		</StorefrontShellSkeleton>
	)
}

export function ProductCarouselSkeleton() {
	return (
		<section className='py-8 space-y-4'>
			<div className='flex items-center justify-between gap-4'>
				<Skeleton className='h-8 w-48' />
				<Skeleton className='h-9 w-24 rounded-md' />
			</div>
			<ProductGridSkeleton
				count={4}
				className='grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4'
			/>
		</section>
	)
}

export function ProductPageSkeleton() {
	return (
		<StorefrontShellSkeleton>
			<div className='pt-4 space-y-4'>
				<Skeleton className='h-4 w-32' />
				<Skeleton className='h-4 w-72' />
				<div className='space-y-3 pb-2'>
					<Skeleton className='h-8 w-4/5 md:h-9 lg:w-3/5' />
					<div className='flex items-center gap-4'>
						<Skeleton className='h-4 w-24' />
						<Skeleton className='h-8 w-28 rounded-full' />
					</div>
				</div>
			</div>

			<div className='flex flex-col gap-8 lg:flex-row'>
				<div className='space-y-4 lg:w-[55%]'>
					<div className='rounded-2xl border border-border p-4 space-y-4'>
						<Skeleton className='h-[360px] w-full rounded-2xl md:h-[420px]' />
						<div className='grid grid-cols-4 gap-3'>
							{Array.from({ length: 4 }).map((_, index) => (
								<Skeleton key={index} className='h-20 rounded-xl' />
							))}
						</div>
					</div>

					<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
						{Array.from({ length: 3 }).map((_, index) => (
							<Skeleton key={index} className='h-20 rounded-2xl' />
						))}
					</div>

					<div className='rounded-2xl border border-border p-6 space-y-4'>
						<div className='flex gap-2'>
							<Skeleton className='h-10 w-28 rounded-full' />
							<Skeleton className='h-10 w-36 rounded-full' />
							<Skeleton className='h-10 w-24 rounded-full' />
						</div>
						{Array.from({ length: 6 }).map((_, index) => (
							<Skeleton key={index} className='h-4 w-full' />
						))}
					</div>
				</div>

				<div className='lg:w-[45%]'>
					<div className='space-y-4 lg:sticky lg:top-4'>
						<div className='rounded-2xl border border-border p-6 space-y-4'>
							<Skeleton className='h-6 w-32' />
							<Skeleton className='h-10 w-40' />
							<Skeleton className='h-4 w-36' />
							<Skeleton className='h-11 w-full rounded-md' />
							<Skeleton className='h-11 w-full rounded-md' />
						</div>

						<div className='rounded-2xl border border-border p-4 space-y-3'>
							<Skeleton className='h-5 w-32' />
							{Array.from({ length: 5 }).map((_, index) => (
								<div
									key={index}
									className='flex items-center justify-between gap-3'
								>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-4 w-20' />
								</div>
							))}
						</div>

						<div className='rounded-2xl border border-border p-6 space-y-3'>
							<Skeleton className='h-5 w-40' />
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-4/5' />
						</div>
					</div>
				</div>
			</div>

			<ProductCarouselSkeleton />
			<ProductCarouselSkeleton />
		</StorefrontShellSkeleton>
	)
}

export function CartContentSkeleton() {
	return (
		<>
			<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
				<div className='space-y-2'>
					<Skeleton className='h-8 w-48' />
				</div>
				<div className='flex gap-2 self-start'>
					<Skeleton className='h-9 w-40 rounded-md' />
					<Skeleton className='h-9 w-36 rounded-md' />
				</div>
			</div>

			<div className='flex flex-col gap-8 lg:flex-row'>
				<div className='min-w-0 flex-1'>
					{Array.from({ length: 3 }).map((_, index) => (
						<CartItemSkeleton key={index} />
					))}
				</div>

				<div className='w-full shrink-0 lg:w-80'>
					<div className='rounded-2xl border border-border p-5 space-y-4'>
						<Skeleton className='h-6 w-32' />
						{Array.from({ length: 4 }).map((_, index) => (
							<div
								key={index}
								className='flex items-center justify-between gap-3'
							>
								<Skeleton className='h-4 w-24' />
								<Skeleton className='h-4 w-20' />
							</div>
						))}
						<Skeleton className='h-11 w-full rounded-md' />
					</div>
				</div>
			</div>
		</>
	)
}

export function CartPageSkeleton() {
	return (
		<StorefrontShellSkeleton>
			<CartContentSkeleton />
		</StorefrontShellSkeleton>
	)
}

export function CompareContentSkeleton() {
	return (
		<>
			<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
				<Skeleton className='h-8 w-56' />
				<Skeleton className='h-9 w-40 rounded-md' />
			</div>

			<div className='flex gap-3 overflow-x-auto border-b border-border pb-2'>
				{Array.from({ length: 3 }).map((_, index) => (
					<Skeleton key={index} className='h-8 w-28 rounded-full shrink-0' />
				))}
			</div>

			<div className='overflow-x-auto pb-4'>
				<div className='min-w-[900px] space-y-4'>
					<div className='flex gap-4'>
						<div className='w-40 shrink-0 space-y-3 pt-3'>
							<Skeleton className='h-5 w-32' />
							<Skeleton className='h-5 w-28' />
						</div>
						<div className='grid flex-1 grid-cols-3 gap-4'>
							{Array.from({ length: 3 }).map((_, index) => (
								<CompareProductCardSkeleton key={index} />
							))}
						</div>
					</div>

					{Array.from({ length: 2 }).map((_, groupIndex) => (
						<div key={groupIndex} className='space-y-3'>
							<Skeleton className='h-8 w-full rounded-md' />
							{Array.from({ length: 4 }).map((__, rowIndex) => (
								<div
									key={rowIndex}
									className='grid grid-cols-[180px_repeat(3,minmax(0,1fr))] gap-4'
								>
									<Skeleton className='h-5 w-full' />
									<Skeleton className='h-5 w-full' />
									<Skeleton className='h-5 w-full' />
									<Skeleton className='h-5 w-full' />
								</div>
							))}
						</div>
					))}
				</div>
			</div>
		</>
	)
}

export function ComparePageSkeleton() {
	return (
		<StorefrontShellSkeleton>
			<CompareContentSkeleton />
		</StorefrontShellSkeleton>
	)
}

export function FavoritesContentSkeleton() {
	return (
		<>
			<div className='flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between md:py-6'>
				<Skeleton className='h-8 w-40' />
				<Skeleton className='h-9 w-32 rounded-md' />
			</div>

			<Skeleton className='mb-6 h-4 w-24' />
			<ProductGridSkeleton />
		</>
	)
}

export function FavoritesPageSkeleton() {
	return (
		<StorefrontShellSkeleton>
			<FavoritesContentSkeleton />
		</StorefrontShellSkeleton>
	)
}
