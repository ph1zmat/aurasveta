import { useState, useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { getApiUrl, setApiUrl } from '../lib/store'
import {
Settings,
Server,
Save,
CheckCircle2,
Info,
} from 'lucide-react'

export function SettingsPage() {
const [url, setUrl] = useState('')
const [saved, setSaved] = useState(false)

useEffect(() => {
getApiUrl().then(setUrl)
}, [])

const handleSave = async () => {
await setApiUrl(url)
setSaved(true)
setTimeout(() => setSaved(false), 2000)
}

return (
<div className='space-y-6'>
{/* Header */}
<div className='flex items-center gap-3'>
<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>
<Settings className='h-5 w-5 text-primary' />
</div>
<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>
Настройки
</h1>
</div>

{/* Server connection */}
<div className='max-w-lg rounded-2xl border border-border bg-muted/10 p-6'>
<div className='flex items-center gap-3 mb-5'>
<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10'>
<Server className='h-5 w-5 text-blue-500' />
</div>
<div>
<h2 className='text-sm font-semibold text-foreground'>
Подключение к серверу
</h2>
<p className='text-xs text-muted-foreground'>
URL API для взаимодействия с CMS
</p>
</div>
</div>

<div className='space-y-4'>
<div>
<label className='mb-1.5 block text-xs font-medium text-muted-foreground'>
URL API-сервера
</label>
<input
type='url'
value={url}
onChange={e => setUrl(e.target.value)}
className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'
placeholder='https://aurasveta.ru'
/>
<p className='mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground'>
<Info className='h-3 w-3' />
Изменение требует перезапуска приложения
</p>
</div>

<div className='flex items-center gap-2'>
<Button size='sm' onClick={handleSave}>
<Save className='mr-1.5 h-3.5 w-3.5' />
Сохранить
</Button>
{saved && (
<span className='flex items-center gap-1 text-xs text-emerald-500'>
<CheckCircle2 className='h-3.5 w-3.5' />
Сохранено
</span>
)}
</div>
</div>
</div>

{/* About */}
<div className='max-w-lg rounded-2xl border border-border bg-muted/10 p-6'>
<div className='flex items-center gap-3 mb-4'>
<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10'>
<Info className='h-5 w-5 text-violet-500' />
</div>
<div>
<h2 className='text-sm font-semibold text-foreground'>
О приложении
</h2>
<p className='text-xs text-muted-foreground'>
Информация о версии
</p>
</div>
</div>

<div className='space-y-2 text-sm'>
<div className='flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2'>
<span className='text-muted-foreground'>Приложение</span>
<span className='font-medium text-foreground'>Аура Света CMS</span>
</div>
<div className='flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2'>
<span className='text-muted-foreground'>Версия</span>
<span className='font-mono text-foreground'>1.0.0</span>
</div>
<div className='flex items-center justify-between rounded-lg bg-muted/20 px-3 py-2'>
<span className='text-muted-foreground'>Стек</span>
<span className='text-foreground'>Electron + React + tRPC</span>
</div>
</div>
</div>
</div>
)
}