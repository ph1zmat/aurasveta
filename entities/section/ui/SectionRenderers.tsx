import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { LinkTarget } from '@/shared/types/sections'
import { cn } from '@/shared/lib/utils'
import { resolveStorageFileUrl } from '@/shared/lib/storage-file-url'
import DeferredImage from '@/shared/ui/DeferredImage'
import ProductCard from '@/entities/product/ui/ProductCard'
import CatalogCategoryCarousel from '@/entities/category/ui/CatalogCategoryCarousel'
import {
	toFrontendProduct,
	toProductCardProps,
} from '@/entities/product/model/adapters'
import type {
	ResolvedSectionRecord,
	SectionRendererComponent,
} from '../registry'

type LinkResolutionSection = Pick<
	ResolvedSectionRecord,
	'pages' | 'categories' | 'products'
>

function splitTextToParagraphs(text?: string | null): string[] {
	if (!text) return []

	return text
		.split(/\n{2,}|\r\n\r\n/)
		.map(part => part.trim())
		.filter(Boolean)
}

function resolveCategoryHref(slug: string) {
	return `/catalog/${slug}`
}

function resolvePageHref(slug: string) {
	return slug === 'home' ? '/' : `/pages/${slug}`
}

function resolveProductHref(slug: string) {
	return `/product/${slug}`
}

function resolveLinkHref(
	target: LinkTarget | undefined,
	section: LinkResolutionSection,
): string | null {
	if (!target) return null

	switch (target.kind) {
		case 'external':
			return target.url
		case 'page': {
			const page = section.pages.find(item => item.id === target.pageId)
			return page ? resolvePageHref(page.slug) : null
		}
		case 'category': {
			const category = section.categories.find(
				item => item.id === target.categoryId,
			)
			return category ? resolveCategoryHref(category.slug) : null
		}
		case 'product': {
			const product = section.products.find(
				item => item.id === target.productId,
			)
			return product ? resolveProductHref(product.slug) : null
		}
	}
}

function resolveLinkLabel(
	target: LinkTarget | undefined,
	section: LinkResolutionSection,
	fallback: string,
): string {
	if (!target) return fallback

	switch (target.kind) {
		case 'page':
			return (
				section.pages.find(item => item.id === target.pageId)?.title ?? fallback
			)
		case 'category':
			return (
				section.categories.find(item => item.id === target.categoryId)?.name ??
				fallback
			)
		case 'product':
			return (
				section.products.find(item => item.id === target.productId)?.name ??
				fallback
			)
		case 'external':
			return fallback
	}
}

function getProductGridClass({
	mobile,
	tablet,
	desktop,
}: {
	mobile: number
	tablet: number
	desktop: number
}) {
	const mobileClass = mobile >= 2 ? 'grid-cols-2' : 'grid-cols-1'
	const tabletClass =
		tablet >= 3
			? 'md:grid-cols-3'
			: tablet >= 2
				? 'md:grid-cols-2'
				: 'md:grid-cols-1'
	const desktopClass =
		desktop >= 6
			? 'xl:grid-cols-6'
			: desktop === 5
				? 'xl:grid-cols-5'
				: desktop === 4
					? 'xl:grid-cols-4'
					: desktop === 3
						? 'xl:grid-cols-3'
						: 'xl:grid-cols-2'

	return `${mobileClass} ${tabletClass} ${desktopClass}`
}

function getGalleryGridClass(layout: 'grid' | 'masonry' | 'carousel') {
	switch (layout) {
		case 'masonry':
			return 'grid-cols-2 md:grid-cols-3 auto-rows-[180px] md:auto-rows-[220px]'
		case 'carousel':
			return 'grid-cols-2 md:grid-cols-4'
		default:
			return 'grid-cols-2 md:grid-cols-3'
	}
}

function getAspectRatioClass(aspectRatio: '1:1' | '4:3' | '3:4' | '16:9') {
	switch (aspectRatio) {
		case '1:1':
			return 'aspect-square'
		case '3:4':
			return 'aspect-[3/4]'
		case '16:9':
			return 'aspect-video'
		default:
			return 'aspect-[4/3]'
	}
}

export const HeroSectionRenderer: SectionRendererComponent<'hero'> = ({
	section,
	title,
	subtitle,
	config,
}) => {
	const image = section.mediaItems[0]?.url ?? null
	const primaryHref = resolveLinkHref(config.primaryCta, section)
	const secondaryHref = resolveLinkHref(config.secondaryCta, section)
	const primaryLabel = resolveLinkLabel(config.primaryCta, section, 'Подробнее')
	const secondaryLabel = resolveLinkLabel(
		config.secondaryCta,
		section,
		'Смотреть ещё',
	)
	const heading = title ?? 'Новый раздел'
	const description = config.description ?? subtitle ?? null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-10'>
			<div className='grid overflow-hidden rounded-3xl border border-border bg-card lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]'>
				<div className='flex flex-col justify-center gap-5 px-6 py-8 md:px-10 md:py-12'>
					{config.badges.length > 0 ? (
						<div className='flex flex-wrap gap-2'>
							{config.badges.map(badge => (
								<span
									key={badge}
									className='rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white bg-accent'
								>
									{badge}
								</span>
							))}
						</div>
					) : null}
					<div className='space-y-3'>
						<h2 className='text-3xl font-semibold tracking-tight text-foreground md:text-5xl'>
							{heading}
						</h2>
						{description ? (
							<p className='max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg'>
								{description}
							</p>
						) : null}
					</div>
					{primaryHref || secondaryHref ? (
						<div className='flex flex-wrap gap-3'>
							{primaryHref ? (
								<Link
									href={primaryHref}
									className='inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
								>
									{primaryLabel}
								</Link>
							) : null}
							{secondaryHref ? (
								<Link
									href={secondaryHref}
									className='inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted'
								>
									{secondaryLabel}
								</Link>
							) : null}
						</div>
					) : null}
				</div>
				<div className='relative min-h-[260px] bg-muted/20'>
					{image ? (
						<DeferredImage
							src={image}
							alt={heading}
							fill
							imageClassName='object-cover'
							fallbackClassName='rounded-none'
						/>
					) : (
						<div className='flex h-full items-center justify-center bg-linear-to-br from-muted/40 to-muted/10'>
							<Sparkles className='h-14 w-14 text-muted-foreground/30' />
						</div>
					)}
				</div>
			</div>
		</section>
	)
}

export const ProductGridSectionRenderer: SectionRendererComponent<
	'product-grid'
> = ({ title, config, section }) => {
	if (section.products.length === 0) return null

	const cards = section.products.map(toFrontendProduct).map(toProductCardProps)
	const heading =
		title ??
		(config.source.mode === 'collection'
			? config.source.collection === 'sale'
				? 'Акции и скидки'
				: config.source.collection === 'new'
					? 'Новинки'
					: 'Подборка товаров'
			: 'Подборка товаров')

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			<div className='mb-4 flex items-center justify-between md:mb-6'>
				<h2 className='text-base font-semibold uppercase tracking-widest text-foreground md:text-lg'>
					{heading}
				</h2>
			</div>
			<div className={cn('grid gap-4', getProductGridClass(config.columns))}>
				{cards.map(product => (
					<ProductCard key={product.href} {...product} />
				))}
			</div>
		</section>
	)
}

export const FeaturedCategoriesSectionRenderer: SectionRendererComponent<
	'featured-categories'
> = ({ title, config, section }) => {
	if (section.categories.length === 0) return null

	const categories = section.categories.map(category => ({
		id: category.id,
		name: category.name,
		href: resolveCategoryHref(category.slug),
		image:
			category.imageUrl ??
			resolveStorageFileUrl(category.imagePath ?? category.image ?? null) ??
			'/placeholder.svg',
		slug: category.slug,
		subcategories: category.children.map(child => ({
			name: child.name,
			href: `${resolveCategoryHref(category.slug)}/${child.slug}`,
		})),
	}))

	if (config.layout === 'carousel') {
		return (
			<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
				{title ? (
					<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
						{title}
					</h2>
				) : null}
				<CatalogCategoryCarousel categories={categories} />
			</section>
		)
	}

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			{title ? (
				<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
					{title}
				</h2>
			) : null}
			<div className='grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
				{categories.map(category => (
					<Link
						key={category.id}
						href={category.href}
						className='group overflow-hidden rounded-2xl border border-border bg-card transition-colors hover:bg-muted/30'
					>
						<div className='relative aspect-4/3 bg-muted/20'>
							<DeferredImage
								src={category.image}
								alt={category.name}
								fill
								imageClassName='object-cover transition-transform duration-300 group-hover:scale-[1.03]'
								fallbackClassName='rounded-none'
							/>
						</div>
						<div className='space-y-2 p-4'>
							<div className='flex items-center justify-between gap-3'>
								<h3 className='text-sm font-medium text-foreground'>
									{category.name}
								</h3>
								<ChevronRight className='h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
							</div>
							{category.subcategories.length > 0 ? (
								<p className='line-clamp-2 text-xs text-muted-foreground'>
									{category.subcategories
										.slice(0, 3)
										.map(item => item.name)
										.join(' • ')}
								</p>
							) : null}
						</div>
					</Link>
				))}
			</div>
		</section>
	)
}

export const RichTextSectionRenderer: SectionRendererComponent<'rich-text'> = ({
	title,
	subtitle,
	config,
}) => {
	const paragraphs = splitTextToParagraphs(config.body)
	const maxWidthClass =
		config.maxWidth === 'full'
			? 'max-w-none'
			: config.maxWidth === 'xl'
				? 'max-w-5xl'
				: config.maxWidth === 'lg'
					? 'max-w-4xl'
					: config.maxWidth === 'md'
						? 'max-w-3xl'
						: 'max-w-2xl'

	return (
		<section className='mx-auto px-4 py-6 md:py-10'>
			<div className={cn('mx-auto space-y-4', maxWidthClass)}>
				{title ? (
					<h2 className='text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
						{title}
					</h2>
				) : null}
				{subtitle ? <p className='text-muted-foreground'>{subtitle}</p> : null}
				<div className='space-y-4 text-base leading-relaxed text-foreground/90'>
					{paragraphs.map((paragraph, index) => (
						<p key={`${index}:${paragraph.slice(0, 16)}`}>{paragraph}</p>
					))}
				</div>
			</div>
		</section>
	)
}

export const GallerySectionRenderer: SectionRendererComponent<'gallery'> = ({
	title,
	config,
	section,
}) => {
	if (section.mediaItems.length === 0) return null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-8'>
			{title ? (
				<h2 className='mb-4 text-base font-semibold uppercase tracking-widest text-foreground md:mb-6 md:text-lg'>
					{title}
				</h2>
			) : null}
			<div className={cn('grid gap-4', getGalleryGridClass(config.layout))}>
				{section.mediaItems.map((item, index) => (
					<div
						key={item.id}
						className={cn(
							'relative overflow-hidden rounded-2xl border border-border bg-muted/20',
							getAspectRatioClass(config.aspectRatio),
							config.layout === 'masonry' && index % 4 === 0
								? 'md:row-span-2'
								: undefined,
						)}
					>
						<DeferredImage
							src={item.url}
							alt={item.alt ?? title ?? 'Изображение галереи'}
							fill
							imageClassName='object-cover transition-transform duration-500 hover:scale-[1.02]'
							fallbackClassName='rounded-none'
						/>
					</div>
				))}
			</div>
		</section>
	)
}

export const BenefitsSectionRenderer: SectionRendererComponent<'benefits'> = ({
	title,
	config,
}) => {
	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-10'>
			{title ? (
				<h2 className='mb-6 text-base font-semibold uppercase tracking-widest text-foreground md:mb-8 md:text-lg'>
					{title}
				</h2>
			) : null}
			<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
				{config.items.map(item => (
					<div
						key={item.title}
						className='rounded-2xl border border-border bg-card p-5'
					>
						<div className='mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary'>
							{item.icon && /^(https?:\/\/|\/)/.test(item.icon) ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={item.icon}
									alt=''
									className='h-6 w-6 object-contain'
								/>
							) : (
								<Sparkles className='h-5 w-5' />
							)}
						</div>
						<h3 className='text-base font-medium text-foreground'>
							{item.title}
						</h3>
						{item.description ? (
							<p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
								{item.description}
							</p>
						) : null}
					</div>
				))}
			</div>
		</section>
	)
}

export const FaqSectionRenderer: SectionRendererComponent<'faq'> = ({
	title,
	config,
}) => {
	return (
		<section className='mx-auto max-w-4xl px-4 py-6 md:py-10'>
			{title ? (
				<h2 className='mb-6 text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
					{title}
				</h2>
			) : null}
			<div className='space-y-3'>
				{config.items.map(item => (
					<details
						key={item.question}
						className='group rounded-2xl border border-border bg-card p-5'
					>
						<summary className='cursor-pointer list-none font-medium text-foreground'>
							{item.question}
						</summary>
						<p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
							{item.answer}
						</p>
					</details>
				))}
			</div>
		</section>
	)
}

export const CtaBannerSectionRenderer: SectionRendererComponent<
	'cta-banner'
> = ({ title, subtitle, config, section }) => {
	const primaryHref = resolveLinkHref(config.primaryCta, section)
	const secondaryHref = resolveLinkHref(config.secondaryCta, section)

	if (!primaryHref) return null

	return (
		<section className='mx-auto max-w-7xl px-4 py-6 md:py-10'>
			<div className='rounded-3xl border border-border bg-linear-to-r from-primary/10 via-card to-primary/5 px-6 py-8 md:px-8 md:py-10'>
				<div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
					<div className='max-w-3xl space-y-2'>
						<h2 className='text-2xl font-semibold tracking-tight text-foreground md:text-3xl'>
							{title ?? 'Готовы продолжить?'}
						</h2>
						{config.description || subtitle ? (
							<p className='text-sm leading-relaxed text-muted-foreground md:text-base'>
								{config.description ?? subtitle}
							</p>
						) : null}
					</div>
					<div className='flex flex-wrap gap-3'>
						<Link
							href={primaryHref}
							className='inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'
						>
							{resolveLinkLabel(config.primaryCta, section, 'Подробнее')}
						</Link>
						{secondaryHref ? (
							<Link
								href={secondaryHref}
								className='inline-flex items-center justify-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted'
							>
								{resolveLinkLabel(
									config.secondaryCta,
									section,
									'Дополнительно',
								)}
							</Link>
						) : null}
					</div>
				</div>
			</div>
		</section>
	)
}
