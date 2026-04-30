'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Save, Plus, Trash2, Loader2, Upload } from 'lucide-react'

interface SocialLink {
	platform: string
	url: string
}

interface WorkingHours {
	[day: string]: string
}

interface ShopFormState {
	phone: string
	additionalPhone: string
	email: string
	supportEmail: string
	address: string
	city: string
	postalCode: string
	workingHours: WorkingHours
	socialLinks: SocialLink[]
	legalInn: string
	legalOgrn: string
	legalKpp: string
	aboutUs: string
	logoUrl: string
	faviconUrl: string
}

const DEFAULT_WORKING_HOURS: WorkingHours = {
	'Пн-Пт': '09:00–20:00',
	'Сб': '10:00–18:00',
	'Вс': 'выходной',
}

const LOGO_INPUT_ID = 'shop-logo-upload'
const FAVICON_INPUT_ID = 'shop-favicon-upload'

export default function ShopSettingsCard() {
	const { data: shopInfo, refetch, isLoading } = trpc.settingsBusiness.getInfo.useQuery()
	const { mutate: updateInfo, isPending: isSaving } = trpc.settingsBusiness.updateInfo.useMutation({
		onSuccess: () => {
			toast.success('Настройки магазина сохранены')
			refetch()
		},
		onError: (e) => toast.error(`Ошибка сохранения: ${e.message}`),
	})

	const [form, setForm] = useState<ShopFormState>({
		phone: '',
		additionalPhone: '',
		email: '',
		supportEmail: '',
		address: '',
		city: '',
		postalCode: '',
		workingHours: DEFAULT_WORKING_HOURS,
		socialLinks: [],
		legalInn: '',
		legalOgrn: '',
		legalKpp: '',
		aboutUs: '',
		logoUrl: '',
		faviconUrl: '',
	})

	const [uploadingLogo, setUploadingLogo] = useState(false)
	const [uploadingFavicon, setUploadingFavicon] = useState(false)

	useEffect(() => {
		if (shopInfo) {
			const legalInfo =
				shopInfo.legalInfo && typeof shopInfo.legalInfo === 'object'
					? (shopInfo.legalInfo as Record<string, string>)
					: {}
			setForm({
				phone: shopInfo.phone ?? '',
				additionalPhone: shopInfo.additionalPhone ?? '',
				email: shopInfo.email ?? '',
				supportEmail: shopInfo.supportEmail ?? '',
				address: shopInfo.address ?? '',
				city: shopInfo.city ?? '',
				postalCode: shopInfo.postalCode ?? '',
				workingHours: (shopInfo.workingHours as WorkingHours | undefined) ?? DEFAULT_WORKING_HOURS,
				socialLinks: (shopInfo.socialLinks as unknown as SocialLink[] | undefined) ?? [],
				legalInn: legalInfo.inn ?? '',
				legalOgrn: legalInfo.ogrn ?? '',
				legalKpp: legalInfo.kpp ?? '',
				aboutUs: shopInfo.aboutUs ?? '',
				logoUrl: shopInfo.logoUrl ?? '',
				faviconUrl: shopInfo.faviconUrl ?? '',
			})
		}
	}, [shopInfo])

	const setField = <K extends keyof ShopFormState>(key: K, value: ShopFormState[K]) => {
		setForm((prev) => ({ ...prev, [key]: value }))
	}

	// Социальные сети
	const addSocialLink = () => {
		setForm((prev) => ({
			...prev,
			socialLinks: [...prev.socialLinks, { platform: '', url: '' }],
		}))
	}

	const updateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
		const updated = [...form.socialLinks]
		updated[index] = { ...updated[index], [field]: value }
		setField('socialLinks', updated)
	}

	const removeSocialLink = (index: number) => {
		setField(
			'socialLinks',
			form.socialLinks.filter((_, i) => i !== index)
		)
	}

	// Режим работы
	const addWorkingHoursRow = () => {
		const key = `День ${Object.keys(form.workingHours).length + 1}`
		setField('workingHours', { ...form.workingHours, [key]: '' })
	}

	const updateWorkingHoursKey = (oldKey: string, newKey: string) => {
		const entries = Object.entries(form.workingHours)
		const idx = entries.findIndex(([k]) => k === oldKey)
		if (idx === -1) return
		entries[idx] = [newKey, entries[idx][1]]
		setField('workingHours', Object.fromEntries(entries))
	}

	const updateWorkingHoursValue = (key: string, value: string) => {
		setField('workingHours', { ...form.workingHours, [key]: value })
	}

	const removeWorkingHoursRow = (key: string) => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { [key]: _, ...rest } = form.workingHours
		setField('workingHours', rest)
	}

	// Загрузка файлов
	const uploadFile = async (
		file: File,
		field: 'logoUrl' | 'faviconUrl',
		setUploading: (v: boolean) => void
	) => {
		setUploading(true)
		try {
			const formData = new FormData()
			formData.append('files', file)
			const res = await fetch('/api/upload', { method: 'POST', body: formData })
			if (!res.ok) {
				const data = await res.json()
				toast.error(data.error ?? 'Ошибка загрузки')
				return
			}
			const json = await res.json()
			const url: string = json.files?.[0]?.url ?? json.url ?? ''
			if (url) setField(field, url)
		} catch {
			toast.error('Ошибка загрузки файла')
		} finally {
			setUploading(false)
		}
	}

	const handleSave = () => {
		if (!form.phone.trim() || !form.email.trim() || !form.address.trim()) {
			toast.error('Заполните обязательные поля: телефон, email и адрес')
			return
		}

		updateInfo({
			phone: form.phone,
			additionalPhone: form.additionalPhone || null,
			email: form.email,
			supportEmail: form.supportEmail || null,
			address: form.address,
			city: form.city || undefined,
			postalCode: form.postalCode || undefined,
			workingHours: form.workingHours,
			socialLinks: form.socialLinks.filter((s) => s.platform && s.url),
			legalInfo: {
				inn: form.legalInn,
				ogrn: form.legalOgrn,
				kpp: form.legalKpp,
			},
			aboutUs: form.aboutUs || undefined,
			logoUrl: form.logoUrl || undefined,
			faviconUrl: form.faviconUrl || undefined,
		})
	}

	if (isLoading) {
		return (
			<Card className='border-border'>
				<CardContent className='py-8 flex justify-center'>
					<Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
				</CardContent>
			</Card>
		)
	}

	return (
		<div className='space-y-4'>
			{/* Контакты */}
			<Card className='border-border'>
				<CardHeader>
					<CardTitle className='text-base font-bold'>Контактная информация</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Основной телефон</label>
							<Input
								value={form.phone}
								onChange={(e) => setField('phone', e.target.value)}
								placeholder='+7 (000) 000-00-00'
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Дополнительный телефон</label>
							<Input
								value={form.additionalPhone}
								onChange={(e) => setField('additionalPhone', e.target.value)}
								placeholder='+7 (000) 000-00-00'
							/>
						</div>
					</div>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Email для заказов</label>
							<Input
								type='email'
								value={form.email}
								onChange={(e) => setField('email', e.target.value)}
								placeholder='orders@example.com'
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Email поддержки</label>
							<Input
								type='email'
								value={form.supportEmail}
								onChange={(e) => setField('supportEmail', e.target.value)}
								placeholder='support@example.com'
							/>
						</div>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Адрес</label>
						<Input
							value={form.address}
							onChange={(e) => setField('address', e.target.value)}
							placeholder='ул. Примерная, д. 1, кв. 1'
						/>
					</div>
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Город</label>
							<Input
								value={form.city}
								onChange={(e) => setField('city', e.target.value)}
								placeholder='Москва'
							/>
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>Индекс</label>
							<Input
								value={form.postalCode}
								onChange={(e) => setField('postalCode', e.target.value)}
								placeholder='123456'
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Режим работы */}
			<Card className='border-border'>
				<CardHeader className='flex-row items-center justify-between'>
					<CardTitle className='text-base font-bold'>Режим работы</CardTitle>
					<Button variant='outline' size='sm' onClick={addWorkingHoursRow}>
						<Plus className='h-4 w-4 mr-1' />
						Добавить строку
					</Button>
				</CardHeader>
				<CardContent className='space-y-2'>
					{Object.entries(form.workingHours).map(([day, hours]) => (
						<div key={day} className='flex gap-2 items-center'>
							<Input
								className='w-40 shrink-0'
								value={day}
								onChange={(e) => updateWorkingHoursKey(day, e.target.value)}
								placeholder='Пн-Пт'
							/>
							<Input
								className='flex-1'
								value={hours}
								onChange={(e) => updateWorkingHoursValue(day, e.target.value)}
								placeholder='09:00–20:00 или выходной'
							/>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => removeWorkingHoursRow(day)}
								className='shrink-0 text-destructive hover:text-destructive'
							>
								<Trash2 className='h-4 w-4' />
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Соцсети */}
			<Card className='border-border'>
				<CardHeader className='flex-row items-center justify-between'>
					<CardTitle className='text-base font-bold'>Социальные сети</CardTitle>
					<Button variant='outline' size='sm' onClick={addSocialLink}>
						<Plus className='h-4 w-4 mr-1' />
						Добавить
					</Button>
				</CardHeader>
				<CardContent className='space-y-2'>
					{form.socialLinks.length === 0 && (
						<p className='text-sm text-muted-foreground'>Нет добавленных соцсетей</p>
					)}
					{form.socialLinks.map((link, i) => (
						<div key={i} className='flex gap-2 items-center'>
							<Input
								className='w-36 shrink-0'
								value={link.platform}
								onChange={(e) => updateSocialLink(i, 'platform', e.target.value)}
								placeholder='vk, telegram...'
							/>
							<Input
								className='flex-1'
								value={link.url}
								onChange={(e) => updateSocialLink(i, 'url', e.target.value)}
								placeholder='https://...'
							/>
							<Button
								variant='ghost'
								size='icon'
								onClick={() => removeSocialLink(i)}
								className='shrink-0 text-destructive hover:text-destructive'
							>
								<Trash2 className='h-4 w-4' />
							</Button>
						</div>
					))}
				</CardContent>
			</Card>

			{/* О компании */}
			<Card className='border-border'>
				<CardHeader>
					<CardTitle className='text-base font-bold'>О компании</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>ИНН</label>
							<Input value={form.legalInn} onChange={(e) => setField('legalInn', e.target.value)} placeholder='7700000000' />
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>ОГРН</label>
							<Input value={form.legalOgrn} onChange={(e) => setField('legalOgrn', e.target.value)} placeholder='1027700000000' />
						</div>
						<div className='space-y-2'>
							<label className='text-sm font-medium'>КПП</label>
							<Input value={form.legalKpp} onChange={(e) => setField('legalKpp', e.target.value)} placeholder='770001001' />
						</div>
					</div>
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Описание компании</label>
						<textarea
							className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring'
							value={form.aboutUs}
							onChange={(e) => setField('aboutUs', e.target.value)}
							placeholder='Расскажите о вашем магазине...'
						/>
					</div>
				</CardContent>
			</Card>

			{/* Логотип и фавикон */}
			<Card className='border-border'>
				<CardHeader>
					<CardTitle className='text-base font-bold'>Логотип и фавикон</CardTitle>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
						{/* Логотип */}
						<div className='space-y-3'>
							<label className='text-sm font-medium'>Логотип</label>
							{form.logoUrl && (
								<div className='h-20 w-full rounded-md border border-border bg-secondary flex items-center justify-center overflow-hidden'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={form.logoUrl}
										alt='Логотип'
										className='max-h-full max-w-full object-contain'
									/>
								</div>
							)}
							<div className='flex gap-2'>
								<Input
									value={form.logoUrl}
									onChange={(e) => setField('logoUrl', e.target.value)}
									placeholder='https://... или загрузить'
									className='flex-1'
								/>
								<label
									htmlFor={LOGO_INPUT_ID}
									className='inline-flex items-center gap-1 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors'
								>
									{uploadingLogo ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Upload className='h-4 w-4' />
									)}
									<span>Загрузить</span>
								</label>
								<input
									id={LOGO_INPUT_ID}
									type='file'
									accept='image/*'
									className='hidden'
									disabled={uploadingLogo}
									onChange={(e) => {
										const file = e.target.files?.[0]
										if (file) uploadFile(file, 'logoUrl', setUploadingLogo)
										e.target.value = ''
									}}
								/>
							</div>
						</div>

						{/* Фавикон */}
						<div className='space-y-3'>
							<label className='text-sm font-medium'>Фавикон</label>
							{form.faviconUrl && (
								<div className='h-20 w-full rounded-md border border-border bg-secondary flex items-center justify-center overflow-hidden'>
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={form.faviconUrl}
										alt='Фавикон'
										className='max-h-16 max-w-16 object-contain'
									/>
								</div>
							)}
							<div className='flex gap-2'>
								<Input
									value={form.faviconUrl}
									onChange={(e) => setField('faviconUrl', e.target.value)}
									placeholder='https://... или загрузить'
									className='flex-1'
								/>
								<label
									htmlFor={FAVICON_INPUT_ID}
									className='inline-flex items-center gap-1 cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors'
								>
									{uploadingFavicon ? (
										<Loader2 className='h-4 w-4 animate-spin' />
									) : (
										<Upload className='h-4 w-4' />
									)}
									<span>Загрузить</span>
								</label>
								<input
									id={FAVICON_INPUT_ID}
									type='file'
									accept='image/x-icon,image/png,image/svg+xml'
									className='hidden'
									disabled={uploadingFavicon}
									onChange={(e) => {
										const file = e.target.files?.[0]
										if (file) uploadFile(file, 'faviconUrl', setUploadingFavicon)
										e.target.value = ''
									}}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Button onClick={handleSave} disabled={isSaving} className='w-full sm:w-auto'>
				{isSaving ? <Loader2 className='h-4 w-4 mr-2 animate-spin' /> : <Save className='h-4 w-4 mr-2' />}
				Сохранить настройки магазина
			</Button>
		</div>
	)
}
