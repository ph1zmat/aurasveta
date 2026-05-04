'use client'

import { useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Save, Loader2, Info } from 'lucide-react'
import ShopSettingsCard from './components/ShopSettingsCard'
import DeliveryAdvantagesCard from './components/DeliveryAdvantagesCard'

type GeneralSettingsForm = {
	shopName: string
	shopUrl: string
	shopEmail: string
	maintenance: boolean
	autoBadgesNewWindowDays: string
	autoBadgesHitWindowDays: string
	autoBadgesHitMinViews: string
	autoBadgesHitMinOrders: string
	autoBadgesEnableHit: boolean
	autoBadgesEnableNew: boolean
	autoBadgesEnableLed: boolean
	autoBadgesEnableSmart: boolean
	autoBadgesEnableSale: boolean
}

function readBooleanSetting(value: unknown, fallback = true): boolean {
	if (typeof value === 'boolean') return value
	if (value === 'false') return false
	if (value === 'true') return true
	return fallback
}

function readStringValue(value: unknown, fallback = '') {
	if (typeof value === 'string') return value
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	return fallback
}

function readNumericString(value: unknown, fallback: string) {
	if (typeof value === 'number' && Number.isFinite(value)) return String(value)
	if (typeof value === 'string' && value.trim().length > 0) return value
	return fallback
}

function buildGeneralSettingsForm(
	settings:
		| Array<{
				key: string
				value: unknown
		  }>
		| undefined,
): GeneralSettingsForm {
	const map = new Map(settings?.map(item => [item.key, item.value]) ?? [])
	return {
		shopName: readStringValue(map.get('shopName')),
		shopUrl: readStringValue(map.get('shopUrl')),
		shopEmail: readStringValue(map.get('shopEmail')),
		maintenance: readStringValue(map.get('maintenance'), 'false') === 'true',
		autoBadgesNewWindowDays: readNumericString(
			map.get('autoBadges.newWindowDays'),
			'2',
		),
		autoBadgesHitWindowDays: readNumericString(
			map.get('autoBadges.hitWindowDays'),
			'30',
		),
		autoBadgesHitMinViews: readNumericString(
			map.get('autoBadges.hitMinViews'),
			'20',
		),
		autoBadgesHitMinOrders: readNumericString(
			map.get('autoBadges.hitMinOrders'),
			'3',
		),
		autoBadgesEnableHit: readBooleanSetting(map.get('autoBadges.enableHit'), true),
		autoBadgesEnableNew: readBooleanSetting(map.get('autoBadges.enableNew'), true),
		autoBadgesEnableLed: readBooleanSetting(map.get('autoBadges.enableLed'), true),
		autoBadgesEnableSmart: readBooleanSetting(map.get('autoBadges.enableSmart'), true),
		autoBadgesEnableSale: readBooleanSetting(map.get('autoBadges.enableSale'), true),
	}
}

function formatSettingValue(value: unknown) {
	if (value == null) return '—'
	if (typeof value === 'string') return value || '—'
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	try {
		return JSON.stringify(value)
	} catch {
		return 'Невозможно отобразить значение'
	}
}

function areFormsEqual(a: GeneralSettingsForm, b: GeneralSettingsForm) {
	return (
		a.shopName === b.shopName &&
		a.shopUrl === b.shopUrl &&
		a.shopEmail === b.shopEmail &&
		a.maintenance === b.maintenance &&
		a.autoBadgesNewWindowDays === b.autoBadgesNewWindowDays &&
		a.autoBadgesHitWindowDays === b.autoBadgesHitWindowDays &&
		a.autoBadgesHitMinViews === b.autoBadgesHitMinViews &&
		a.autoBadgesHitMinOrders === b.autoBadgesHitMinOrders &&
		a.autoBadgesEnableHit === b.autoBadgesEnableHit &&
		a.autoBadgesEnableNew === b.autoBadgesEnableNew &&
		a.autoBadgesEnableLed === b.autoBadgesEnableLed &&
		a.autoBadgesEnableSmart === b.autoBadgesEnableSmart &&
		a.autoBadgesEnableSale === b.autoBadgesEnableSale
	)
}

export default function SettingsClient() {
	const utils = trpc.useUtils()
	const {
		data: settings,
		isLoading,
		isError,
		error,
		refetch,
	} = trpc.setting.getAll.useQuery(undefined, {
		staleTime: 5 * 60 * 1000,
		refetchOnWindowFocus: false,
	})
	const [draftForm, setDraftForm] = useState<GeneralSettingsForm | null>(null)

	const { mutate: bulkUpsert, isPending: isSaving } = trpc.setting.bulkUpsert.useMutation({
		onSuccess: async () => {
			toast.success('Настройки сохранены')
			setDraftForm(null)
			await utils.setting.getAll.invalidate()
		},
		onError: (e) => toast.error(e.message),
	})

	const initialForm = useMemo(() => buildGeneralSettingsForm(settings), [settings])
	const form = draftForm ?? initialForm

	const hasChanges = useMemo(() => !areFormsEqual(form, initialForm), [form, initialForm])

	const handleSave = () => {
		const newWindowDays = Number(form.autoBadgesNewWindowDays)
		const hitWindowDays = Number(form.autoBadgesHitWindowDays)
		const hitMinViews = Number(form.autoBadgesHitMinViews)
		const hitMinOrders = Number(form.autoBadgesHitMinOrders)

		if (
			!Number.isFinite(newWindowDays) ||
			newWindowDays < 1 ||
			!Number.isFinite(hitWindowDays) ||
			hitWindowDays < 1 ||
			!Number.isFinite(hitMinViews) ||
			hitMinViews < 1 ||
			!Number.isFinite(hitMinOrders) ||
			hitMinOrders < 1
		) {
			toast.error('Проверьте значения порогов автобейджей: они должны быть больше 0')
			return
		}

		bulkUpsert([
			{ key: 'shopName', value: form.shopName, type: 'string', isPublic: true, group: 'general' },
			{ key: 'shopUrl', value: form.shopUrl, type: 'string', isPublic: true, group: 'general' },
			{ key: 'shopEmail', value: form.shopEmail, type: 'string', isPublic: false, group: 'general' },
			{ key: 'maintenance', value: String(form.maintenance), type: 'boolean', isPublic: false, group: 'general' },
			{
				key: 'autoBadges.newWindowDays',
				value: Math.trunc(newWindowDays),
				type: 'number',
				isPublic: false,
				group: 'catalog',
				description: 'Новинка: окно в днях от даты создания товара',
			},
			{
				key: 'autoBadges.hitWindowDays',
				value: Math.trunc(hitWindowDays),
				type: 'number',
				isPublic: false,
				group: 'catalog',
				description: 'Хит: окно анализа просмотров/заказов в днях',
			},
			{
				key: 'autoBadges.hitMinViews',
				value: Math.trunc(hitMinViews),
				type: 'number',
				isPublic: false,
				group: 'catalog',
				description: 'Хит: минимальное число просмотров за окно',
			},
			{
				key: 'autoBadges.hitMinOrders',
				value: Math.trunc(hitMinOrders),
				type: 'number',
				isPublic: false,
				group: 'catalog',
				description: 'Хит: минимальное число заказанных единиц за окно',
			},
			{ key: 'autoBadges.enableHit', value: String(form.autoBadgesEnableHit), type: 'boolean', isPublic: false, group: 'catalog', description: 'Включить автобейдж «Хит»' },
			{ key: 'autoBadges.enableNew', value: String(form.autoBadgesEnableNew), type: 'boolean', isPublic: false, group: 'catalog', description: 'Включить автобейдж «Новинка»' },
			{ key: 'autoBadges.enableLed', value: String(form.autoBadgesEnableLed), type: 'boolean', isPublic: false, group: 'catalog', description: 'Включить автобейдж «LED»' },
			{ key: 'autoBadges.enableSmart', value: String(form.autoBadgesEnableSmart), type: 'boolean', isPublic: false, group: 'catalog', description: 'Включить автобейдж «Smart»' },
			{ key: 'autoBadges.enableSale', value: String(form.autoBadgesEnableSale), type: 'boolean', isPublic: false, group: 'catalog', description: 'Включить автобейдж «Акция»' },
		])
	}

	if (isLoading && !settings) {
		return (
			<div className='space-y-4'>
				<div>
					<h1 className='text-xl font-bold'>Настройки</h1>
					<p className='text-sm text-muted-foreground'>Загружаем данные магазина…</p>
				</div>
				<Card className='border-border'>
					<CardContent className='flex items-center gap-2 py-8 text-sm text-muted-foreground'>
						<Loader2 className='h-4 w-4 animate-spin' />
						Загрузка настроек...
					</CardContent>
				</Card>
			</div>
		)
	}

	if (isError) {
		return (
			<div className='space-y-4'>
				<div>
					<h1 className='text-xl font-bold'>Настройки</h1>
					<p className='text-sm text-muted-foreground'>Не удалось загрузить данные настроек.</p>
				</div>
				<Card className='border-border'>
					<CardContent className='space-y-4 py-8'>
						<p className='text-sm text-destructive'>
							{error.message || 'Ошибка загрузки настроек'}
						</p>
						<Button onClick={() => refetch()} variant='outline'>
							Повторить
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className='space-y-4'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-xl font-bold'>Настройки</h1>
					<p className='text-sm text-muted-foreground'>Управление магазином и доступами</p>
				</div>
			</div>

			<Tabs defaultValue='general'>
				<TabsList>
					<TabsTrigger value='general'>Общие</TabsTrigger>
					<TabsTrigger value='shop'>Магазин</TabsTrigger>
					<TabsTrigger value='catalog'>Каталог</TabsTrigger>
					<TabsTrigger value='security'>Безопасность</TabsTrigger>
					<TabsTrigger value='system'>Системные</TabsTrigger>
				</TabsList>

				<TabsContent value='general' className='mt-4'>
					<Card className='border-border'>
						<CardHeader>
							<CardTitle className='text-base font-bold'>Основные</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Название магазина</label>
								<Input
									value={form.shopName}
									onChange={(e) =>
										setDraftForm(prev => ({
											...(prev ?? initialForm),
											shopName: e.target.value,
										}))
									}
								/>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>URL сайта</label>
								<Input
									value={form.shopUrl}
									onChange={(e) =>
										setDraftForm(prev => ({
											...(prev ?? initialForm),
											shopUrl: e.target.value,
										}))
									}
								/>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Email администратора</label>
								<Input
									value={form.shopEmail}
									onChange={(e) =>
										setDraftForm(prev => ({
											...(prev ?? initialForm),
											shopEmail: e.target.value,
										}))
									}
								/>
							</div>
							<div className='flex items-center justify-between py-2 border-t border-border'>
								<div>
									<div className='text-sm font-medium'>Режим обслуживания</div>
									<div className='text-xs text-muted-foreground'>Сайт будет недоступен</div>
								</div>
								<Switch
									checked={form.maintenance}
									onCheckedChange={(v) =>
										setDraftForm(prev => ({
											...(prev ?? initialForm),
											maintenance: v,
										}))
									}
								/>
							</div>

							<div className='space-y-3 border-t border-border pt-3'>
								<div className='text-sm font-medium'>Автобейджи каталога</div>
								<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
									<div className='space-y-2'>
										<label className='text-xs text-muted-foreground'>Новинка: дней с даты создания</label>
										<Input
											type='number'
											min={1}
											value={form.autoBadgesNewWindowDays}
											onChange={(e) =>
												setDraftForm(prev => ({
													...(prev ?? initialForm),
													autoBadgesNewWindowDays: e.target.value,
												}))
											}
										/>
									</div>
									<div className='space-y-2'>
										<label className='text-xs text-muted-foreground'>Хит: окно анализа, дней</label>
										<Input
											type='number'
											min={1}
											value={form.autoBadgesHitWindowDays}
											onChange={(e) =>
												setDraftForm(prev => ({
													...(prev ?? initialForm),
													autoBadgesHitWindowDays: e.target.value,
												}))
											}
										/>
									</div>
									<div className='space-y-2'>
										<label className='text-xs text-muted-foreground'>Хит: минимум просмотров</label>
										<Input
											type='number'
											min={1}
											value={form.autoBadgesHitMinViews}
											onChange={(e) =>
												setDraftForm(prev => ({
													...(prev ?? initialForm),
													autoBadgesHitMinViews: e.target.value,
												}))
											}
										/>
									</div>
									<div className='space-y-2'>
										<label className='text-xs text-muted-foreground'>Хит: минимум заказанных единиц</label>
										<Input
											type='number'
											min={1}
											value={form.autoBadgesHitMinOrders}
											onChange={(e) =>
												setDraftForm(prev => ({
													...(prev ?? initialForm),
													autoBadgesHitMinOrders: e.target.value,
												}))
											}
										/>
									</div>
								</div>
							</div>

							<div className='space-y-1 border-t border-border pt-3'>
								<div className='text-xs font-medium text-muted-foreground mb-2'>Включить/выключить правила</div>
								{(
									[
										{ key: 'autoBadgesEnableHit' as const, label: 'Хит', hint: 'по просмотрам / заказам' },
										{ key: 'autoBadgesEnableNew' as const, label: 'Новинка', hint: 'по дате создания' },
										{ key: 'autoBadgesEnableLed' as const, label: 'LED', hint: 'по свойствам товара' },
										{ key: 'autoBadgesEnableSmart' as const, label: 'Smart', hint: 'по свойствам товара' },
										{ key: 'autoBadgesEnableSale' as const, label: 'Акция', hint: 'если цена со скидкой > цены' },
									] as const
								).map(({ key, label, hint }) => (
									<div key={key} className='flex items-center justify-between py-1.5'>
										<div>
											<span className='text-sm font-medium'>{label}</span>
											<span className='ml-1.5 text-xs text-muted-foreground'>{hint}</span>
										</div>
										<Switch
											checked={form[key]}
											onCheckedChange={(v) =>
												setDraftForm(prev => ({
													...(prev ?? initialForm),
													[key]: v,
												}))
											}
										/>
									</div>
								))}
							</div>

							<Button className='w-full' onClick={handleSave} disabled={isSaving || !hasChanges}>
								{isSaving ? <Loader2 className='h-4 w-4 mr-1 animate-spin' /> : <Save className='h-4 w-4 mr-1' />}
								Сохранить
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='shop' className='mt-4'>
					<ShopSettingsCard />
				</TabsContent>

				<TabsContent value='catalog' className='mt-4'>
					<DeliveryAdvantagesCard />
				</TabsContent>

				<TabsContent value='security' className='mt-4'>
					<Card className='border-border'>
						<CardHeader>
							<CardTitle className='text-base font-bold'>Безопасность</CardTitle>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='space-y-2'>
								<div className='text-sm font-medium mb-2'>Активные сессии</div>
								<p className='text-xs text-muted-foreground'>
									Управление сессиями доступно через профиль пользователя.
								</p>
							</div>
							<div
								className='flex items-center justify-between py-2 border-t border-border'
								title='Двухфакторная аутентификация будет доступна в следующем обновлении'
							>
								<div className='flex items-center gap-2'>
									<div>
										<div className='text-sm font-medium'>2FA</div>
										<div className='text-xs text-muted-foreground'>Требуется настройка на сервере</div>
									</div>
									<Info className='h-3.5 w-3.5 text-muted-foreground cursor-help' />
								</div>
								<Switch disabled />
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value='system' className='mt-4'>
					<Card className='border-border'>
						<CardHeader>
							<CardTitle className='text-base font-bold'>Системные настройки</CardTitle>
						</CardHeader>
						<CardContent>
							{!settings ? (
								<div className='flex items-center gap-2 text-sm text-muted-foreground'>
									<Loader2 className='h-4 w-4 animate-spin' />
									Загрузка...
								</div>
							) : (
								<div className='space-y-2'>
									{settings.map((s) => (
										<div key={s.key} className='flex items-center justify-between py-2 border-b border-border last:border-0'>
											<div>
												<div className='text-sm font-medium'>{s.key}</div>
												{s.description && <div className='text-xs text-muted-foreground'>{s.description}</div>}
											</div>
											<Badge variant='secondary' className='text-[10px]'>
												{formatSettingValue(s.value).slice(0, 40)}
											</Badge>
										</div>
									))}
									</div>
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		)
}
