'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { formatForDisplay, type RegisterableHotkey } from '@tanstack/hotkeys'
import { useStore } from '@tanstack/react-store'
import { Search, Plus, ArrowRight, Command, Sparkles } from 'lucide-react'
import { mergeSearchParams } from '@aurasveta/shared-admin'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import AdminModal from '@/shared/ui/AdminModal'
import {
	adminCommandPaletteStore,
	closeAdminCommandPalette,
	toggleAdminCommandPalette,
} from './admin-command-palette.store'
import { getAdminNavItems } from './admin-nav'
import {
	useAdminHotkeyRegistrations,
	useAdminHotkeys,
} from '../hooks/useAdminHotkeys'

type AdminCommand = {
	id: string
	title: string
	description: string
	group: string
	keywords: string[]
	hotkey?: RegisterableHotkey
	onRun: () => void
}

interface AdminCommandPaletteProps {
	userRole: string
}

export default function AdminCommandPalette({
	userRole,
}: AdminCommandPaletteProps) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const inputRef = useRef<HTMLInputElement>(null)
	const isOpen = useStore(adminCommandPaletteStore, state => state.isOpen)
	const registrations = useAdminHotkeyRegistrations()
	const [query, setQuery] = useState('')
	const [activeIndex, setActiveIndex] = useState(0)
	const navItems = useMemo(() => getAdminNavItems(userRole), [userRole])

	const navigate = useCallback(
		(href: string) => {
			closeAdminCommandPalette()
			setQuery('')
			router.push(href)
		},
		[router],
	)

	const buildHref = useCallback(
		(
			basePath: string,
			updates: Record<
				string,
				string | number | boolean | null | undefined
			> = {},
			preserveCurrent = basePath === pathname,
		) => {
			const params = mergeSearchParams(
				preserveCurrent ? searchParams : '',
				updates,
			)
			const queryString = params.toString()

			return queryString ? `${basePath}?${queryString}` : basePath
		},
		[pathname, searchParams],
	)

	const currentPrimaryAction = useMemo<AdminCommand | null>(() => {
		switch (pathname) {
			case '/admin/pages':
				return {
					id: 'current-new-page',
					title: 'Новая страница',
					description: 'Открыть page modal и сохранить текущие фильтры списка.',
					group: 'Быстрые действия',
					keywords: ['create', 'new', 'page', 'страница'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(buildHref('/admin/pages', { create: true, edit: null })),
				}
			case '/admin/products':
				return {
					id: 'current-new-product',
					title: 'Новый товар',
					description:
						'Открыть форму добавления товара поверх текущей выборки.',
					group: 'Быстрые действия',
					keywords: ['create', 'product', 'товар', 'catalog'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(
							buildHref('/admin/products', { create: true, edit: null }),
						),
				}
			case '/admin/categories':
				return {
					id: 'current-new-category',
					title: 'Новая категория',
					description: 'Открыть category modal на текущем экране категорий.',
					group: 'Быстрые действия',
					keywords: ['create', 'category', 'категория', 'tree'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(
							buildHref('/admin/categories', {
								create: true,
								edit: null,
								parent: null,
							}),
						),
				}
			case '/admin/properties':
				return {
					id: 'current-new-property',
					title: 'Новое свойство',
					description:
						'Открыть property modal и оставить текущий поиск нетронутым.',
					group: 'Быстрые действия',
					keywords: ['create', 'property', 'свойство', 'filters'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(
							buildHref('/admin/properties', { create: true, edit: null }),
						),
				}
			case '/admin/home-sections':
				return {
					id: 'current-new-home-section',
					title: 'Новая секция',
					description:
						'Открыть route-driven сценарий создания секции главной страницы.',
					group: 'Быстрые действия',
					keywords: ['create', 'section', 'hero', 'главная'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(
							buildHref('/admin/home-sections', { create: true, edit: null }),
						),
				}
			case '/admin/webhooks':
				return {
					id: 'current-new-webhook',
					title: 'Новый вебхук',
					description: 'Открыть modal создания вебхука.',
					group: 'Быстрые действия',
					keywords: ['create', 'webhook', 'integration', 'api'],
					hotkey: 'Alt+Shift+N',
					onRun: () => navigate(buildHref('/admin/webhooks', { create: true })),
				}
			case '/admin/orders':
				return {
					id: 'current-pending-orders',
					title: 'Новые заказы',
					description:
						'Переключиться на PENDING и начать разбор свежих заказов.',
					group: 'Быстрые действия',
					keywords: ['orders', 'pending', 'новые', 'sales'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(
							buildHref('/admin/orders', {
								status: 'PENDING',
								page: 1,
								search: null,
								order: null,
							}),
						),
				}
			case '/admin/seo':
				return {
					id: 'current-home-seo',
					title: 'SEO главной страницы',
					description: 'Открыть meta-редактор для главной страницы магазина.',
					group: 'Быстрые действия',
					keywords: ['seo', 'home', 'главная', 'meta'],
					hotkey: 'Alt+Shift+N',
					onRun: () =>
						navigate(
							buildHref('/admin/seo', {
								targetType: 'page',
								targetId: 'home',
								targetName: 'Главная страница',
							}),
						),
				}
			default:
				return null
		}
	}, [buildHref, navigate, pathname])

	const commands = useMemo<AdminCommand[]>(() => {
		const navigationCommands = navItems.map(item => ({
			id: `nav:${item.href}`,
			title: item.label,
			description: `Перейти в раздел ${item.label.toLowerCase()}.`,
			group: 'Навигация',
			keywords: [item.href, ...(item.keywords ?? [])],
			onRun: () => navigate(item.href),
		}))

		const createCommands: AdminCommand[] = [
			{
				id: 'create-page',
				title: 'Создать страницу',
				description: 'Открыть CMS-форму новой страницы.',
				group: 'Создание',
				keywords: ['new', 'create', 'page', 'страница'],
				onRun: () =>
					navigate(buildHref('/admin/pages', { create: true }, false)),
			},
		]

		if (userRole === 'ADMIN') {
			createCommands.push(
				{
					id: 'create-product',
					title: 'Создать товар',
					description: 'Открыть product form для нового товара.',
					group: 'Создание',
					keywords: ['new', 'product', 'товар', 'catalog'],
					onRun: () =>
						navigate(buildHref('/admin/products', { create: true }, false)),
				},
				{
					id: 'create-category',
					title: 'Создать категорию',
					description: 'Открыть форму новой категории.',
					group: 'Создание',
					keywords: ['new', 'category', 'категория'],
					onRun: () =>
						navigate(buildHref('/admin/categories', { create: true }, false)),
				},
				{
					id: 'create-property',
					title: 'Создать свойство',
					description: 'Открыть форму нового свойства каталога.',
					group: 'Создание',
					keywords: ['new', 'property', 'свойство'],
					onRun: () =>
						navigate(buildHref('/admin/properties', { create: true }, false)),
				},
				{
					id: 'create-home-section',
					title: 'Создать секцию главной',
					description: 'Открыть сценарий создания home section.',
					group: 'Создание',
					keywords: ['new', 'section', 'главная', 'home'],
					onRun: () =>
						navigate(
							buildHref('/admin/home-sections', { create: true }, false),
						),
				},
				{
					id: 'create-home-section-type',
					title: 'Создать тип секции',
					description: 'Открыть форму нового типа секции главной.',
					group: 'Создание',
					keywords: ['new', 'section type', 'тип секции'],
					onRun: () =>
						navigate(
							buildHref('/admin/home-sections', { createType: true }, false),
						),
				},
				{
					id: 'create-webhook',
					title: 'Создать вебхук',
					description: 'Открыть modal создания webhook integration.',
					group: 'Создание',
					keywords: ['new', 'webhook', 'integration'],
					onRun: () =>
						navigate(buildHref('/admin/webhooks', { create: true }, false)),
				},
				{
					id: 'seo-home-page',
					title: 'SEO главной страницы',
					description: 'Открыть редактор мета-тегов главной страницы.',
					group: 'Создание',
					keywords: ['seo', 'home', 'главная', 'meta'],
					onRun: () =>
						navigate(
							buildHref(
								'/admin/seo',
								{
									targetType: 'page',
									targetId: 'home',
									targetName: 'Главная страница',
								},
								false,
							),
						),
				},
			)
		}

		const focusCommands: AdminCommand[] =
			userRole === 'ADMIN'
				? [
						{
							id: 'orders-pending',
							title: 'Открыть новые заказы',
							description: 'Перейти на вкладку PENDING без лишних кругов ада.',
							group: 'Фокус',
							keywords: ['orders', 'pending', 'новые'],
							onRun: () =>
								navigate(
									buildHref(
										'/admin/orders',
										{ status: 'PENDING', page: 1, search: null, order: null },
										false,
									),
								),
						},
						{
							id: 'orders-paid',
							title: 'Открыть оплаченные заказы',
							description: 'Перейти на вкладку PAID в заказах.',
							group: 'Фокус',
							keywords: ['orders', 'paid', 'оплачено'],
							onRun: () =>
								navigate(
									buildHref(
										'/admin/orders',
										{ status: 'PAID', page: 1, search: null, order: null },
										false,
									),
								),
						},
					]
				: []

		return [
			...(currentPrimaryAction ? [currentPrimaryAction] : []),
			...navigationCommands,
			...createCommands,
			...focusCommands,
		]
	}, [buildHref, currentPrimaryAction, navItems, navigate, userRole])

	const filteredCommands = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase()

		if (!normalizedQuery) return commands

		return commands.filter(command => {
			const haystack = [
				command.title,
				command.description,
				command.group,
				...command.keywords,
			]
				.join(' ')
				.toLowerCase()

			return haystack.includes(normalizedQuery)
		})
	}, [commands, query])

	const groupedCommands = useMemo(() => {
		return filteredCommands.reduce<
			Array<{ label: string; items: AdminCommand[] }>
		>((accumulator, command) => {
			const existingGroup = accumulator.find(
				group => group.label === command.group,
			)

			if (existingGroup) {
				existingGroup.items.push(command)
				return accumulator
			}

			accumulator.push({ label: command.group, items: [command] })
			return accumulator
		}, [])
	}, [filteredCommands])

	useEffect(() => {
		if (!isOpen) {
			setQuery('')
			setActiveIndex(0)
			return
		}

		queueMicrotask(() => inputRef.current?.focus())
	}, [isOpen])

	useEffect(() => {
		if (filteredCommands.length === 0) {
			setActiveIndex(0)
			return
		}

		setActiveIndex(currentIndex =>
			Math.min(currentIndex, filteredCommands.length - 1),
		)
	}, [filteredCommands.length])

	const hotkeyDefinitions = useMemo(() => {
		const definitions = [
			{
				hotkey: 'Mod+K' as RegisterableHotkey,
				callback: () => toggleAdminCommandPalette(),
				options: {
					requireReset: true,
					meta: {
						name: 'Командная палитра',
						description: 'Открыть глобальную палитру команд админки.',
					},
				},
			},
		]

		if (currentPrimaryAction?.hotkey) {
			definitions.push({
				hotkey: currentPrimaryAction.hotkey,
				callback: () => currentPrimaryAction.onRun(),
				options: {
					requireReset: true,
					meta: {
						name: currentPrimaryAction.title,
						description: currentPrimaryAction.description,
					},
				},
			})
		}

		if (userRole === 'ADMIN') {
			definitions.push(
				{
					hotkey: 'Alt+Shift+D',
					callback: () => navigate('/admin'),
					options: {
						requireReset: true,
						meta: {
							name: 'Дашборд',
							description: 'Быстрый переход на главную админки.',
						},
					},
				},
				{
					hotkey: 'Alt+Shift+P',
					callback: () => navigate('/admin/products'),
					options: {
						requireReset: true,
						meta: {
							name: 'Товары',
							description: 'Быстрый переход в каталог товаров.',
						},
					},
				},
				{
					hotkey: 'Alt+Shift+C',
					callback: () => navigate('/admin/categories'),
					options: {
						requireReset: true,
						meta: {
							name: 'Категории',
							description: 'Быстрый переход к дереву категорий.',
						},
					},
				},
				{
					hotkey: 'Alt+Shift+O',
					callback: () => navigate('/admin/orders'),
					options: {
						requireReset: true,
						meta: {
							name: 'Заказы',
							description: 'Быстрый переход в раздел заказов.',
						},
					},
				},
			)
		}

		return definitions
	}, [currentPrimaryAction, navigate, userRole])

	useAdminHotkeys(hotkeyDefinitions)

	const executeCommand = useCallback((command: AdminCommand | undefined) => {
		if (!command) return
		command.onRun()
	}, [])

	const handleInputKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLInputElement>) => {
			if (event.key === 'ArrowDown') {
				event.preventDefault()
				setActiveIndex(currentIndex =>
					filteredCommands.length === 0
						? 0
						: (currentIndex + 1) % filteredCommands.length,
				)
				return
			}

			if (event.key === 'ArrowUp') {
				event.preventDefault()
				setActiveIndex(currentIndex => {
					if (filteredCommands.length === 0) return 0
					if (currentIndex === 0) return filteredCommands.length - 1
					return currentIndex - 1
				})
				return
			}

			if (event.key === 'Enter') {
				event.preventDefault()
				executeCommand(filteredCommands[activeIndex])
				return
			}

			if (event.key === 'Escape') {
				event.preventDefault()
				closeAdminCommandPalette()
			}
		},
		[activeIndex, executeCommand, filteredCommands],
	)

	return (
		<AdminModal
			isOpen={isOpen}
			onClose={() => closeAdminCommandPalette()}
			title={
				<div className='flex items-center gap-2'>
					<Command className='h-5 w-5 text-primary' />
					<span>Command palette</span>
				</div>
			}
			size='xl'
			className='overflow-hidden'
			bodyClassName='p-0'
		>
			<div className='grid min-h-[520px] lg:grid-cols-[minmax(0,1fr)_320px]'>
				<div className='flex min-h-0 flex-col'>
					<div className='border-b border-border px-5 py-4'>
						<label htmlFor='admin-command-palette-search' className='sr-only'>
							Поиск команд
						</label>
						<div className='relative'>
							<Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
							<input
								id='admin-command-palette-search'
								ref={inputRef}
								value={query}
								onChange={event => {
									setQuery(event.target.value)
									setActiveIndex(0)
								}}
								onKeyDown={handleInputKeyDown}
								placeholder='Перейти, создать, открыть SEO, найти заказы...'
								className='flex h-12 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
							/>
						</div>
					</div>

					<div className='min-h-0 flex-1 overflow-y-auto px-3 py-3'>
						{filteredCommands.length === 0 ? (
							<div className='flex h-full min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 px-6 text-center'>
								<Sparkles className='mb-3 h-8 w-8 text-primary/60' />
								<p className='text-sm font-medium text-foreground'>
									Ничего не найдено
								</p>
								<p className='mt-1 max-w-sm text-sm text-muted-foreground'>
									Попробуйте поискать по названию раздела, действию или ключевым
									словам вроде “товары”, “seo” или “новые заказы”.
								</p>
							</div>
						) : (
							groupedCommands.map(group => (
								<div key={group.label} className='mb-4 last:mb-0'>
									<div className='px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground'>
										{group.label}
									</div>
									<div className='space-y-1'>
										{group.items.map(command => {
											const commandIndex = filteredCommands.findIndex(
												item => item.id === command.id,
											)
											const isActive = commandIndex === activeIndex

											return (
												<button
													key={command.id}
													type='button'
													onMouseEnter={() => setActiveIndex(commandIndex)}
													onClick={() => executeCommand(command)}
													className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors ${
														isActive
															? 'border-primary/40 bg-primary/8 shadow-sm'
															: 'border-transparent hover:border-border hover:bg-muted/40'
													}`}
												>
													<div
														className={`mt-0.5 rounded-xl p-2 ${isActive ? 'bg-primary/12 text-primary' : 'bg-muted text-muted-foreground'}`}
													>
														{command.group === 'Создание' ? (
															<Plus className='h-4 w-4' />
														) : (
															<ArrowRight className='h-4 w-4' />
														)}
													</div>
													<div className='min-w-0 flex-1'>
														<div className='flex items-center justify-between gap-3'>
															<div className='truncate text-sm font-medium text-foreground'>
																{command.title}
															</div>
															{command.hotkey ? (
																<kbd className='hidden rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground sm:inline-flex'>
																	{formatForDisplay(command.hotkey)}
																</kbd>
															) : null}
														</div>
														<p className='mt-1 text-sm text-muted-foreground'>
															{command.description}
														</p>
													</div>
												</button>
											)
										})}
									</div>
								</div>
							))
						)}
					</div>
				</div>

				<aside className='border-t border-border bg-muted/20 px-5 py-4 lg:border-l lg:border-t-0'>
					<div className='mb-4'>
						<div className='text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground'>
							Горячие клавиши
						</div>
						<p className='mt-2 text-sm text-muted-foreground'>
							Палитра показывает реальные зарегистрированные shortcuts admin
							shell, а не фантазии на тему клавиатуры.
						</p>
					</div>

					<div className='space-y-2'>
						{registrations.map(registration => (
							<div
								key={registration.id}
								className='rounded-2xl border border-border bg-background/80 px-3 py-3'
							>
								<div className='flex items-center justify-between gap-3'>
									<div className='text-sm font-medium text-foreground'>
										{registration.options.meta?.name ?? registration.hotkey}
									</div>
									<kbd className='rounded-lg border border-border bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground'>
										{formatForDisplay(registration.hotkey)}
									</kbd>
								</div>
								{registration.options.meta?.description ? (
									<p className='mt-1 text-sm text-muted-foreground'>
										{registration.options.meta.description}
									</p>
								) : null}
							</div>
						))}
					</div>

					<div className='mt-5 rounded-2xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground'>
						<div className='font-medium text-foreground'>
							Навигация внутри палитры
						</div>
						<ul className='mt-2 space-y-1'>
							<li>↑ / ↓ — перемещение по списку</li>
							<li>Enter — выполнить команду</li>
							<li>Esc — закрыть palette</li>
						</ul>
					</div>
				</aside>
			</div>
		</AdminModal>
	)
}
