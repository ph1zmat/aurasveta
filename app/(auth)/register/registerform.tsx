'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { authClient } from '@/lib/auth/authclient'
import { Button } from '@/shared/ui/button'
import Field from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { trpc } from '@/lib/trpc/client'
import {
	anonymousSessionIdAtom,
	anonymousCartAtom,
	anonymousFavoritesAtom,
	anonymousCompareAtom,
} from '@/lib/store/anonymous'

export default function RegisterForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [phone, setPhone] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const setAnonSessionId = useSetAtom(anonymousSessionIdAtom)
	const setAnonCart = useSetAtom(anonymousCartAtom)
	const setAnonFavorites = useSetAtom(anonymousFavoritesAtom)
	const setAnonCompare = useSetAtom(anonymousCompareAtom)
	const migrateToUser = trpc.anonymous.migrateToUser.useMutation()
	const migrateCompare = trpc.anonymous.migrateCompare.useMutation()

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setError('')
		setLoading(true)

		try {
			const result = await authClient.signUp.email({
				email,
				password,
				name,
			})

			if (result.error) {
				setError(result.error.message ?? 'Ошибка регистрации')
			} else {
				// Update phone if provided
				if (phone) {
					await fetch('/api/trpc/profile.update', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ phone }),
					})
				}

				// Migrate anonymous cart/favorites to user account
				const anonSessionId = localStorage.getItem('aura-anon-session')
				if (anonSessionId) {
					try {
						const parsed = JSON.parse(anonSessionId)
						if (parsed) {
							await migrateToUser.mutateAsync(parsed)
						}
					} catch {
						// Ignore migration errors
					}
					setAnonSessionId(null)
					setAnonCart([])
					setAnonFavorites([])
				}

				// Migrate anonymous compare list
				const anonCompare = localStorage.getItem('aura-anon-compare')
				if (anonCompare) {
					try {
						const parsed = JSON.parse(anonCompare)
						if (Array.isArray(parsed) && parsed.length > 0) {
							await migrateCompare.mutateAsync(parsed)
						}
					} catch {
						// Ignore
					}
					setAnonCompare([])
				}

				const callbackUrl = searchParams.get('callbackUrl')
				router.push(callbackUrl || '/')
				router.refresh()
			}
		} catch {
			setError('Произошла ошибка')
		} finally {
			setLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit} className='space-y-3 sm:space-y-4'>
			{error && (
				<div className='rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>
					{error}
				</div>
			)}

			<Field label='Имя' htmlFor='name'>
				<Input
					id='name'
					type='text'
					value={name}
					onChange={e => setName(e.target.value)}
					required
					placeholder='Ваше имя'
					autoComplete='name'
				/>
			</Field>

			<Field label='Email' htmlFor='email'>
				<Input
					id='email'
					type='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					placeholder='your@email.com'
					autoComplete='email'
				/>
			</Field>

			<Field
				label='Телефон'
				htmlFor='phone'
				hint='Необязательно — пригодится для связи по заказу.'
			>
				<Input
					id='phone'
					type='tel'
					value={phone}
					onChange={e => setPhone(e.target.value)}
					placeholder='+375 29 123-45-67'
					autoComplete='tel'
				/>
			</Field>

			<Field label='Пароль' htmlFor='password' hint='Минимум 8 символов.'>
				<Input
					id='password'
					type='password'
					value={password}
					onChange={e => setPassword(e.target.value)}
					required
					minLength={8}
					placeholder='Минимум 8 символов'
					autoComplete='new-password'
				/>
			</Field>

			<Button
				type='submit'
				variant='primary'
				size='lg'
				fullWidth
				disabled={loading}
			>
				{loading ? 'Регистрация...' : 'Зарегистрироваться'}
			</Button>

			<p className='text-center text-sm text-muted-foreground'>
				Уже есть аккаунт?{' '}
				<Link
					href={
						searchParams.get('callbackUrl')
							? `/login?callbackUrl=${encodeURIComponent(
									searchParams.get('callbackUrl')!,
								)}`
							: '/login'
					}
					className='text-primary hover:underline'
				>
					Войти
				</Link>
			</p>
		</form>
	)
}
