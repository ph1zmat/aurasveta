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

type GeneralSettingsForm = {
	shopName: string
	shopUrl: string
	shopEmail: string
	maintenance: boolean
}

function readStringValue(value: unknown, fallback = '') {
	if (typeof value === 'string') return value
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
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
		a.maintenance === b.maintenance
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
		bulkUpsert([
			{ key: 'shopName', value: form.shopName, type: 'string', isPublic: true, group: 'general' },
			{ key: 'shopUrl', value: form.shopUrl, type: 'string', isPublic: true, group: 'general' },
			{ key: 'shopEmail', value: form.shopEmail, type: 'string', isPublic: false, group: 'general' },
			{ key: 'maintenance', value: String(form.maintenance), type: 'boolean', isPublic: false, group: 'general' },
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
