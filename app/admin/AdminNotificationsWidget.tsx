'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { trpc } from '@/lib/trpc/client'

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = window.atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i)
		outputArray[i] = rawData.charCodeAt(i)
	return outputArray
}

function canUseWebPush() {
	return (
		typeof window !== 'undefined' &&
		'Notification' in window &&
		'serviceWorker' in navigator &&
		'PushManager' in window
	)
}

async function getSubscriptionJson() {
	const reg = await navigator.serviceWorker.ready
	const sub = await reg.pushManager.getSubscription()
	return sub?.toJSON() as PushSubscriptionJSON | undefined
}

export default function AdminNotificationsWidget() {
	const registerMut = trpc.push.register.useMutation()
	const vapidPublicKey = useMemo(
		() => process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
		[],
	)
	const lastRegisteredEndpointRef = useMemo(() => ({ current: '' }), [])

	const [permission, setPermission] = useState<string>('unknown')
	const [hasSW, setHasSW] = useState<boolean>(false)
	const [hasSub, setHasSub] = useState<boolean>(false)
	const [lastError, setLastError] = useState<string>('')
	const [busy, setBusy] = useState<boolean>(false)

	const refreshStatus = useCallback(async () => {
		setPermission(
			typeof Notification !== 'undefined'
				? Notification.permission
				: 'unsupported',
		)
		setHasSW(typeof navigator !== 'undefined' && 'serviceWorker' in navigator)
		try {
			if (!('serviceWorker' in navigator)) {
				setHasSub(false)
				return
			}
			const json = await getSubscriptionJson()
			setHasSub(Boolean(json?.endpoint))
		} catch {
			setHasSub(false)
		}
	}, [])

	useEffect(() => {
		refreshStatus()
	}, [refreshStatus])

	const enable = useCallback(async () => {
		setBusy(true)
		setLastError('')
		try {
			if (!canUseWebPush()) {
				throw new Error('Web Push не поддерживается в этом окружении')
			}
			if (!vapidPublicKey) {
				throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY не задан')
			}

			const perm = await Notification.requestPermission()
			setPermission(perm)
			if (perm !== 'granted') {
				throw new Error(`Permission: ${perm}`)
			}

			const reg = await navigator.serviceWorker.register('/cms-sw.js', {
				scope: '/',
			})
			const subscription =
				(await reg.pushManager.getSubscription()) ??
				(await reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
				}))

			const json = subscription.toJSON() as PushSubscriptionJSON
			const endpoint = json?.endpoint as string | undefined
			const p256dh = json?.keys?.p256dh as string | undefined
			const authKey = json?.keys?.auth as string | undefined
			if (!endpoint || !p256dh || !authKey) {
				throw new Error('Подписка создана, но отсутствуют endpoint/keys')
			}

			// Dedup: don't re-register same endpoint within this browser profile
			const storageKey = 'cms:webpush:lastEndpoint'
			const last = window.localStorage.getItem(storageKey) || ''
			if (last !== endpoint && lastRegisteredEndpointRef.current !== endpoint) {
				lastRegisteredEndpointRef.current = endpoint
				await registerMut.mutateAsync({
					platform: 'WEB_PUSH',
					token: endpoint,
					endpoint,
					p256dh,
					authKey,
				})
				window.localStorage.setItem(storageKey, endpoint)
			}

			setHasSub(true)
		} catch (e) {
			setLastError(e instanceof Error ? e.message : String(e))
		} finally {
			setBusy(false)
			refreshStatus()
		}
	}, [lastRegisteredEndpointRef, registerMut, refreshStatus, vapidPublicKey])

	const sendTest = useCallback(async () => {
		setBusy(true)
		setLastError('')
		try {
			const res = await fetch('/api/push/notify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: 'Тест уведомления',
					message: 'Если видишь это — Web Push настроен.',
					data: { type: 'test' },
				}),
			})
			const json = await res.json().catch(() => ({}))
			if (!res.ok) {
				throw new Error(`${res.status} ${JSON.stringify(json)}`)
			}
		} catch (e) {
			setLastError(e instanceof Error ? e.message : String(e))
		} finally {
			setBusy(false)
			refreshStatus()
		}
	}, [refreshStatus])

	const debug = useCallback(async () => {
		setBusy(true)
		setLastError('')
		try {
			const res = await fetch('/api/push/debug', { method: 'GET' })
			const json = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json)}`)
			alert(JSON.stringify(json, null, 2))
		} catch (e) {
			setLastError(e instanceof Error ? e.message : String(e))
		} finally {
			setBusy(false)
		}
	}, [])

	// Мини-виджет снизу справа (только в CMS)
	return (
		<div className='fixed bottom-4 right-4 z-[60] w-[320px] rounded-2xl border border-border bg-background/95 p-4 shadow-xl backdrop-blur'>
			<div className='mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
				Уведомления CMS
			</div>

			<div className='space-y-1 text-xs'>
				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Permission</span>
					<span className='font-mono'>{permission}</span>
				</div>
				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Service Worker</span>
					<span className='font-mono'>{hasSW ? 'yes' : 'no'}</span>
				</div>
				<div className='flex items-center justify-between'>
					<span className='text-muted-foreground'>Subscription</span>
					<span className='font-mono'>{hasSub ? 'yes' : 'no'}</span>
				</div>
			</div>

			{lastError && (
				<div className='mt-3 rounded-lg bg-destructive/10 p-2 text-xs text-destructive'>
					{lastError}
				</div>
			)}

			<div className='mt-3 flex gap-2'>
				<button
					type='button'
					onClick={enable}
					disabled={busy}
					className='flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-60'
				>
					Включить
				</button>
				<button
					type='button'
					onClick={sendTest}
					disabled={busy}
					className='rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground disabled:opacity-60'
				>
					Тест
				</button>
				<button
					type='button'
					onClick={debug}
					disabled={busy}
					className='rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground disabled:opacity-60'
				>
					Debug
				</button>
			</div>
		</div>
	)
}
