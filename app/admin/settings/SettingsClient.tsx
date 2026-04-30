'use client'

import { useState, useEffect } from 'react'
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

export default function SettingsClient() {
	const { data: settings, refetch } = trpc.setting.getAll.useQuery()
	const { mutate: bulkUpsert, isPending: isSaving } = trpc.setting.bulkUpsert.useMutation({
		onSuccess: () => {
			toast.success('Настройки сохранены')
			refetch()
		},
		onError: (e) => toast.error(e.message),
	})

	const getValue = (key: string, fallback: string) => {
		const s = settings?.find((x) => x.key === key)
		return s ? String(s.value) : fallback
	}

	const [shopName, setShopName] = useState('')
	const [shopUrl, setShopUrl] = useState('')
	const [shopEmail, setShopEmail] = useState('')
	const [maintenance, setMaintenance] = useState(false)
	const [hasChanges, setHasChanges] = useState(false)

	useEffect(() => {
		if (settings) {
			setShopName(getValue('shopName', ''))
			setShopUrl(getValue('shopUrl', ''))
			setShopEmail(getValue('shopEmail', ''))
			setMaintenance(getValue('maintenance', 'false') === 'true')
			setHasChanges(false)
		}
	}, [settings])

	const handleSave = () => {
		bulkUpsert([
			{ key: 'shopName', value: shopName, type: 'string', isPublic: true, group: 'general' },
			{ key: 'shopUrl', value: shopUrl, type: 'string', isPublic: true, group: 'general' },
			{ key: 'shopEmail', value: shopEmail, type: 'string', isPublic: false, group: 'general' },
			{ key: 'maintenance', value: String(maintenance), type: 'boolean', isPublic: false, group: 'general' },
		])
		setHasChanges(false)
	}

	const markChanged = () => setHasChanges(true)

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
									value={shopName}
									onChange={(e) => { setShopName(e.target.value); markChanged() }}
								/>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>URL сайта</label>
								<Input
									value={shopUrl}
									onChange={(e) => { setShopUrl(e.target.value); markChanged() }}
								/>
							</div>
							<div className='space-y-2'>
								<label className='text-sm font-medium'>Email администратора</label>
								<Input
									value={shopEmail}
									onChange={(e) => { setShopEmail(e.target.value); markChanged() }}
								/>
							</div>
							<div className='flex items-center justify-between py-2 border-t border-border'>
								<div>
									<div className='text-sm font-medium'>Режим обслуживания</div>
									<div className='text-xs text-muted-foreground'>Сайт будет недоступен</div>
								</div>
								<Switch
									checked={maintenance}
									onCheckedChange={(v) => { setMaintenance(v); markChanged() }}
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
												{String(s.value).slice(0, 40)}
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
