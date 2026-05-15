'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AlertTriangle, CheckCircle2, Eye, FileCheck } from 'lucide-react'
import { toast } from 'sonner'
import { useSeoBulk } from '../_hooks/use-seo-bulk'
import { TARGET_TYPE_OPTIONS, BULK_MODES, BULK_TARGET_LABELS, BULK_MODE_LABELS } from '../_lib/constants'

export function SeoBulkTab() {
	const {
		targetType, setTargetType,
		mode, setMode,
		onlyMissing, setOnlyMissing,
		previewDone, previewData,
		isPreviewing, isApplying, isApplyingAll,
		handlePreview, handleApplyCurrentBatch, handleApplyAll,
		reset,
	} = useSeoBulk()

	const onApplyCurrentBatch = async () => {
		try {
			const result = await handleApplyCurrentBatch()
			toast.success(`Обработан батч: ${result.applied} изменений, ${result.skipped} пропусков, ${result.errors} ошибок.`)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Не удалось применить батч')
		}
	}

	const onApplyAll = async () => {
		try {
			const result = await handleApplyAll()
			if (result) {
				const message = `Обработано всё: ${result.applied} изменений за ${result.batches} батчей. Пропущено: ${result.skipped}. Ошибок: ${result.errors}.`
				if (result.errors > 0) toast.error(message)
				else toast.success(message)
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Не удалось обработать весь список')
		}
	}

	return (
		<div className='space-y-4 max-w-2xl'>
			<div>
				<h3 className='text-sm font-semibold mb-3'>Массовая генерация мета-тегов</h3>
				<div className='space-y-3'>
					<div>
						<label className='text-xs font-medium text-muted-foreground block mb-1'>Тип сущности</label>
						<div className='flex gap-1'>
							{TARGET_TYPE_OPTIONS.map((t) => (
								<Button
									key={t}
									size='sm'
									variant={targetType === t ? 'default' : 'outline'}
									onClick={() => { setTargetType(t); reset() }}
									className='text-xs h-7'
								>
									{BULK_TARGET_LABELS[t]}
								</Button>
							))}
						</div>
					</div>
					<div>
						<label className='text-xs font-medium text-muted-foreground block mb-1'>Режим</label>
						<div className='flex gap-1'>
							{BULK_MODES.map((m) => (
								<Button
									key={m}
									size='sm'
									variant={mode === m ? 'default' : 'outline'}
									onClick={() => { setMode(m); reset() }}
									className='text-xs h-7'
								>
									{BULK_MODE_LABELS[m]}
								</Button>
							))}
						</div>
						<p className='text-[11px] text-muted-foreground mt-1'>
							{mode === 'strict' && 'Только пустые поля — не трогает ручные правки'}
							{mode === 'safe-overwrite' && 'Безопасный — без ручных правок'}
							{mode === 'force' && 'Полный — перезаписать всё'}
						</p>
					</div>
					<div className='flex items-center gap-2'>
						<Switch
							checked={onlyMissing}
							onCheckedChange={(v) => { setOnlyMissing(v); reset() }}
							id='only-missing-bulk'
						/>
						<label htmlFor='only-missing-bulk' className='text-xs text-muted-foreground cursor-pointer'>
							Только записи без SEO-метаданных
						</label>
					</div>
				</div>
			</div>

			<div className='flex gap-2'>
				<Button onClick={handlePreview} disabled={isPreviewing} className='gap-2'>
					<Eye className='h-4 w-4' />
					{isPreviewing ? 'Считаем…' : 'Предпросмотр'}
				</Button>
				<Button variant='outline' onClick={onApplyCurrentBatch} disabled={!previewDone || isApplying || isApplyingAll} className='gap-2'>
					<FileCheck className='h-4 w-4' />
					{isApplying ? 'Применяем…' : 'Применить батч'}
				</Button>
				<Button variant='secondary' onClick={onApplyAll} disabled={isApplying || isApplyingAll} className='gap-2'>
					{isApplyingAll ? 'Обрабатываем всё…' : 'Обработать всё'}
				</Button>
			</div>

			{mode === 'force' && (
				<div className='flex items-center gap-1.5 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive'>
					<AlertTriangle className='h-3.5 w-3.5 shrink-0' />
					Полный режим перезапишет все поля
				</div>
			)}

			{previewData && previewDone && (
				<Card className='border-border bg-secondary/30'>
					<CardContent className='p-3 space-y-2'>
						<div className='flex items-center gap-2 text-sm font-medium'>
							<CheckCircle2 className='h-4 w-4 text-success' />
							Результат предпросмотра
						</div>
						<div className='grid grid-cols-3 gap-3 text-center text-xs'>
							<div><div className='text-lg font-bold'>{previewData.total}</div><div className='text-muted-foreground'>всего</div></div>
							<div><div className='text-lg font-bold text-warning'>{previewData.affected}</div><div className='text-muted-foreground'>изменится</div></div>
							<div><div className='text-lg font-bold text-muted-foreground'>{previewData.unchanged}</div><div className='text-muted-foreground'>без изменений</div></div>
						</div>
						{previewData.samples.length > 0 && (
							<div className='space-y-1 max-h-40 overflow-y-auto'>
								<div className='text-xs font-medium text-muted-foreground'>Примеры изменений:</div>
								{previewData.samples.slice(0, 5).map((s) => (
									<div key={s.targetId} className='rounded border border-border bg-background p-2 text-xs'>
										<div className='font-medium truncate'>{s.entityName}</div>
										{s.diff.slice(0, 2).map((d) => (
											<div key={String(d.field)} className='text-muted-foreground truncate'>
												<span className='text-destructive line-through'>{String(d.before ?? '—').slice(0, 40)}</span>
												{' → '}
												<span className='text-success'>{String(d.after ?? '—').slice(0, 40)}</span>
											</div>
										))}
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
