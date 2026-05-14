'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'

export type PolicyOption = {
	id: string
	name: string
	code: string
	isDefault: boolean
	isActive: boolean
}

type MerchantPolicyManagementCardProps = {
	title: string
	description: string
	loading?: boolean
	policies: PolicyOption[]
	onCreate: (input: { code: string; name: string }) => void
	onUpdate: (input: {
		id: string
		code: string
		name: string
		isActive: boolean
	}) => void
	onDelete: (id: string) => void
	onSetDefault: (id: string) => void
	onArchive: (id: string) => void
}

function toCode(input: string) {
	return input
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.slice(0, 64)
}

export default function MerchantPolicyManagementCard({
	title,
	description,
	loading,
	policies,
	onCreate,
	onUpdate,
	onDelete,
	onSetDefault,
	onArchive,
}: MerchantPolicyManagementCardProps) {
	const [name, setName] = useState('')
	const [code, setCode] = useState('')
	const [showArchived, setShowArchived] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingName, setEditingName] = useState('')
	const [editingCode, setEditingCode] = useState('')
	const [editingActive, setEditingActive] = useState(true)

	const filteredPolicies = useMemo(
		() => (showArchived ? policies : policies.filter(policy => policy.isActive)),
		[policies, showArchived],
	)

	const defaultPolicy = policies.find(policy => policy.isDefault && policy.isActive)

	const handleCreate = () => {
		const nextCode = toCode(code || name)
		if (!name.trim() || !nextCode) return
		onCreate({
			name: name.trim(),
			code: nextCode,
		})
		setName('')
		setCode('')
	}

	const startEdit = (policy: PolicyOption) => {
		setEditingId(policy.id)
		setEditingName(policy.name)
		setEditingCode(policy.code)
		setEditingActive(policy.isActive)
	}

	const cancelEdit = () => {
		setEditingId(null)
		setEditingName('')
		setEditingCode('')
		setEditingActive(true)
	}

	const handleSaveEdit = () => {
		if (!editingId || !editingName.trim()) return
		const normalizedCode = toCode(editingCode || editingName)
		if (!normalizedCode) return

		onUpdate({
			id: editingId,
			name: editingName.trim(),
			code: normalizedCode,
			isActive: editingActive,
		})

		cancelEdit()
	}

	return (
		<Card className='border-border'>
			<CardHeader>
				<CardTitle className='text-base font-bold'>{title}</CardTitle>
				<p className='text-xs text-muted-foreground'>{description}</p>
			</CardHeader>
			<CardContent className='space-y-4'>
				{loading ? (
					<div className='flex items-center gap-2 text-sm text-muted-foreground'>
						<Loader2 className='h-4 w-4 animate-spin' /> Загрузка...
					</div>
				) : (
					<>
						<div className='space-y-2 rounded-md border border-border p-3'>
							<div className='text-xs font-medium text-muted-foreground'>Новая policy</div>
							<div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
								<Input
									value={name}
									onChange={event => setName(event.target.value)}
									placeholder='Название policy'
								/>
								<Input
									value={code}
									onChange={event => setCode(toCode(event.target.value))}
									placeholder='code (например default-by)'
								/>
							</div>
							<Button type='button' onClick={handleCreate} variant='outline' size='sm'>
								Создать policy
							</Button>
						</div>

						<div className='space-y-2'>
							<div className='flex items-center justify-between'>
								<div className='text-xs text-muted-foreground'>
									Default: {defaultPolicy ? defaultPolicy.name : 'не выбран'}
								</div>
								<div className='flex items-center gap-2 text-xs text-muted-foreground'>
									<span>Показывать архив</span>
									<Switch
										checked={showArchived}
										onCheckedChange={setShowArchived}
									/>
								</div>
							</div>

							{filteredPolicies.length === 0 ? (
								<div className='rounded-md border border-dashed border-border p-3 text-sm text-muted-foreground'>
									Нет policy для отображения
								</div>
							) : (
								<div className='space-y-2'>
									{filteredPolicies.map(policy => (
										<div
											key={policy.id}
											className='rounded-md border border-border p-3'
										>
											{editingId === policy.id ? (
												<div className='space-y-3'>
													<div className='grid grid-cols-1 gap-2 md:grid-cols-2'>
														<Input
															value={editingName}
															onChange={event => setEditingName(event.target.value)}
															placeholder='Название policy'
														/>
														<Input
															value={editingCode}
															onChange={event => setEditingCode(toCode(event.target.value))}
															placeholder='code'
														/>
													</div>
													<div className='flex items-center justify-between rounded-md border border-border px-3 py-2'>
														<span className='text-xs text-muted-foreground'>Активна</span>
														<Switch checked={editingActive} onCheckedChange={setEditingActive} />
													</div>
													<div className='flex gap-2'>
														<Button type='button' size='sm' onClick={handleSaveEdit}>
															Сохранить
														</Button>
														<Button type='button' size='sm' variant='outline' onClick={cancelEdit}>
															Отмена
														</Button>
													</div>
												</div>
											) : (
												<div className='flex flex-wrap items-center justify-between gap-2'>
													<div>
														<div className='text-sm font-medium'>
															{policy.name}
														</div>
														<div className='text-xs text-muted-foreground'>
															code: {policy.code} · {policy.isActive ? 'active' : 'archived'}
														</div>
													</div>
													<div className='flex flex-wrap gap-2'>
														<Button
															type='button'
															size='sm'
															variant={policy.isDefault ? 'default' : 'outline'}
															onClick={() => onSetDefault(policy.id)}
														>
															{policy.isDefault ? 'Default' : 'Сделать default'}
														</Button>
														<Button type='button' size='sm' variant='outline' onClick={() => startEdit(policy)}>
															Редактировать
														</Button>
														{policy.isActive && !policy.isDefault && (
															<Button
																type='button'
																size='sm'
																variant='ghost'
																onClick={() => onArchive(policy.id)}
															>
																Архивировать
															</Button>
														)}
														{!policy.isDefault && (
															<Button
																type='button'
																size='sm'
																variant='ghost'
																onClick={() => onDelete(policy.id)}
															>
																Удалить
															</Button>
														)}
													</div>
												</div>
											)}
										</div>
									))}
								</div>
							)}
						</div>
					</>
				)}
			</CardContent>
		</Card>
	)
}
