'use client'

import {
	useState,
	useCallback,
	useEffect,
	useRef,
	forwardRef,
	useImperativeHandle,
	Children,
	type ReactNode,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/Button'

export interface SliderHandle {
	next: () => void
	prev: () => void
	goTo: (index: number) => void
}

/** Responsive breakpoints: key = min container width in px, value = overrides */
export interface SliderBreakpoint {
	visibleItems?: number
	gap?: number
}

export interface SliderProps {
	children: ReactNode
	visibleItems?: number
	autoPlay?: boolean
	autoPlayInterval?: number
	arrows?: boolean
	arrowsPosition?: 'inside' | 'outside'
	dots?: boolean
	loop?: boolean
	gap?: number
	/** Responsive overrides keyed by min container width (px). Example: { 0: { visibleItems: 2 }, 640: { visibleItems: 4 } } */
	breakpoints?: Record<number, SliderBreakpoint>
	className?: string
	slideClassName?: string
	arrowClassName?: string
	renderArrow?: (props: {
		direction: 'prev' | 'next'
		onClick: () => void
		disabled: boolean
	}) => ReactNode
}

/** Resolve breakpoint overrides based on current container width */
function resolveBreakpoints(
	containerWidth: number,
	breakpoints: Record<number, SliderBreakpoint> | undefined,
	defaultVisibleItems: number,
	defaultGap: number,
): { visibleItems: number; gap: number } {
	if (!breakpoints)
		return { visibleItems: defaultVisibleItems, gap: defaultGap }
	const resolved = { visibleItems: defaultVisibleItems, gap: defaultGap }
	const sortedKeys = Object.keys(breakpoints)
		.map(Number)
		.sort((a, b) => a - b)
	for (const bp of sortedKeys) {
		if (containerWidth >= bp) {
			const override = breakpoints[bp]
			if (override.visibleItems !== undefined)
				resolved.visibleItems = override.visibleItems
			if (override.gap !== undefined) resolved.gap = override.gap
		}
	}
	return resolved
}

const Slider = forwardRef<SliderHandle, SliderProps>(
	(
		{
			children,
			visibleItems: defaultVisibleItems = 1,
			autoPlay = false,
			autoPlayInterval = 3000,
			arrows = true,
			arrowsPosition = 'inside',
			dots = false,
			loop = true,
			gap: defaultGap = 0,
			breakpoints,
			className,
			slideClassName,
			arrowClassName,
			renderArrow,
		},
		ref,
	) => {
		const slides = Children.toArray(children)
		const total = slides.length

		const [containerWidth, setContainerWidth] = useState(0)
		const viewportRef = useRef<HTMLDivElement>(null)

		/* Measure viewport */
		useEffect(() => {
			const el = viewportRef.current
			if (!el) return
			setContainerWidth(el.clientWidth)
			const observer = new ResizeObserver(entries => {
				setContainerWidth(entries[0].contentRect.width)
			})
			observer.observe(el)
			return () => observer.disconnect()
		}, [])

		const { visibleItems, gap } = resolveBreakpoints(
			containerWidth,
			breakpoints,
			defaultVisibleItems,
			defaultGap,
		)

		const maxIndex = Math.max(0, total - visibleItems)

		const [rawCurrentIndex, setCurrentIndex] = useState(0)
		const currentIndex = Math.min(rawCurrentIndex, maxIndex)
		const [paused, setPaused] = useState(false)

		/* Touch swipe */
		const touchStartX = useRef<number | null>(null)
		const touchDelta = useRef(0)

		const slideWidth =
			containerWidth > 0
				? (containerWidth - gap * (visibleItems - 1)) / visibleItems
				: 0

		/* Navigation */
		const goTo = useCallback(
			(index: number) => {
				if (loop) {
					if (index > maxIndex) setCurrentIndex(0)
					else if (index < 0) setCurrentIndex(maxIndex)
					else setCurrentIndex(index)
				} else {
					setCurrentIndex(Math.max(0, Math.min(index, maxIndex)))
				}
			},
			[loop, maxIndex],
		)

		const next = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex])
		const prev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex])

		useImperativeHandle(ref, () => ({ next, prev, goTo }), [next, prev, goTo])

		/* Auto play */
		useEffect(() => {
			if (!autoPlay || paused || total <= visibleItems) return
			const id = setInterval(next, autoPlayInterval)
			return () => clearInterval(id)
		}, [autoPlay, autoPlayInterval, next, paused, total, visibleItems])

		/* Computed values */
		const trackOffset = -(currentIndex * (slideWidth + gap))
		const canGoPrev = loop || currentIndex > 0
		const canGoNext = loop || currentIndex < maxIndex
		const dotCount = Math.max(1, total - visibleItems + 1)
		const showArrows = arrows && total > visibleItems

		/* Touch handlers */
		const handleTouchStart = (e: React.TouchEvent) => {
			touchStartX.current = e.touches[0].clientX
		}
		const handleTouchMove = (e: React.TouchEvent) => {
			if (touchStartX.current === null) return
			touchDelta.current = e.touches[0].clientX - touchStartX.current
		}
		const handleTouchEnd = () => {
			if (Math.abs(touchDelta.current) > 50) {
				if (touchDelta.current < 0) next()
				else prev()
			}
			touchStartX.current = null
			touchDelta.current = 0
		}

		/* Keyboard */
		const handleKeyDown = (e: React.KeyboardEvent) => {
			if (e.key === 'ArrowLeft') {
				e.preventDefault()
				prev()
			} else if (e.key === 'ArrowRight') {
				e.preventDefault()
				next()
			}
		}

		if (total === 0) return null

		const defaultArrow = (direction: 'prev' | 'next') => (
			<Button
				variant='icon'
				size='icon'
				onClick={direction === 'prev' ? prev : next}
				disabled={direction === 'prev' ? !canGoPrev : !canGoNext}
				className={cn(
					'rounded-full border border-border bg-card shadow-sm hover:bg-accent hover:text-white',
					arrowClassName,
				)}
				aria-label={direction === 'prev' ? 'Назад' : 'Вперёд'}
			>
				{direction === 'prev' ? (
					<ChevronLeft className='h-5 w-5' strokeWidth={1.5} />
				) : (
					<ChevronRight className='h-5 w-5' strokeWidth={1.5} />
				)}
			</Button>
		)

		const arrow = (direction: 'prev' | 'next') => {
			const disabled = direction === 'prev' ? !canGoPrev : !canGoNext
			const onClick = direction === 'prev' ? prev : next
			if (renderArrow) return renderArrow({ direction, onClick, disabled })
			return defaultArrow(direction)
		}

		return (
			<div
				className={cn('relative', className)}
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
				onKeyDown={handleKeyDown}
				role='region'
				aria-roledescription='carousel'
				tabIndex={0}
			>
				<div
					className={cn(
						'flex items-center',
						arrowsPosition === 'outside' && showArrows && 'gap-2',
					)}
				>
					{/* Outside left arrow */}
					{showArrows && arrowsPosition === 'outside' && (
						<div className='shrink-0'>{arrow('prev')}</div>
					)}

					{/* Viewport */}
					<div
						ref={viewportRef}
						className='flex-1 overflow-hidden'
						onTouchStart={handleTouchStart}
						onTouchMove={handleTouchMove}
						onTouchEnd={handleTouchEnd}
					>
						<div
							className={cn('flex', containerWidth === 0 && 'opacity-0')}
							style={{
								gap: `${gap}px`,
								transform: `translateX(${trackOffset}px)`,
								transition: 'transform 300ms ease-out',
							}}
						>
							{slides.map((slide, i) => (
								<div
									key={i}
									className={cn('shrink-0', slideClassName)}
									style={{ width: slideWidth > 0 ? slideWidth : undefined }}
									role='group'
									aria-roledescription='slide'
									aria-label={`Слайд ${i + 1} из ${total}`}
								>
									{slide}
								</div>
							))}
						</div>
					</div>

					{/* Outside right arrow */}
					{showArrows && arrowsPosition === 'outside' && (
						<div className='shrink-0'>{arrow('next')}</div>
					)}
				</div>

				{/* Inside arrows */}
				{showArrows && arrowsPosition === 'inside' && (
					<>
						<div className='absolute left-2 top-1/2 z-10 -translate-y-1/2'>
							{arrow('prev')}
						</div>
						<div className='absolute right-2 top-1/2 z-10 -translate-y-1/2'>
							{arrow('next')}
						</div>
					</>
				)}

				{/* Dots */}
				{dots && dotCount > 1 && (
					<div className='mt-3 flex justify-center gap-2' role='tablist'>
						{Array.from({ length: dotCount }, (_, i) => (
							<button
								key={i}
								onClick={() => goTo(i)}
								className={cn(
									'h-2.5 w-2.5 rounded-full border-2 border-foreground cursor-pointer transition-colors',
									i === currentIndex ? 'bg-foreground' : 'bg-transparent',
								)}
								role='tab'
								aria-selected={i === currentIndex}
								aria-label={`Перейти к слайду ${i + 1}`}
							/>
						))}
					</div>
				)}
			</div>
		)
	},
)

Slider.displayName = 'Slider'

export { Slider }
export default Slider
