'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSetAtom } from 'jotai'
import { Eye, EyeOff } from 'lucide-react'
import { authClient } from '@/lib/auth/authclient'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { trpc } from '@/lib/trpc/client'
import {
	anonymousSessionIdAtom,
	anonymousCartAtom,
	anonymousFavoritesAtom,
	anonymousCompareAtom,
} from '@/lib/store/anonymous'

export default function LoginForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassword, setShowPassword] = useState(false)
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
			const result = await authClient.signIn.email({
				email,
				password,
			})

			if (result.error) {
				setError(result.error.message ?? 'Ошибка входа')
			} else {
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

				// Redirect admin to CMS, regular users to homepage
				const callbackUrl = searchParams.get('callbackUrl')
				const user = result.data?.user as { role?: string } | undefined
				if (callbackUrl) {
					router.push(callbackUrl)
				} else if (user?.role === 'ADMIN') {
					router.push('/admin')
				} else {
					router.push('/')
				}
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

			<div className='space-y-2'>
				<label htmlFor='email' className='text-sm font-medium text-foreground'>
					Email
				</label>
				<Input
					id='email'
					type='email'
					value={email}
					onChange={e => setEmail(e.target.value)}
					required
					placeholder='your@email.com'
					autoComplete='email'
					inputMode='email'
				/>
			</div>

			<div className='space-y-2'>
				<label
					htmlFor='password'
					className='text-sm font-medium text-foreground'
				>
					Пароль
				</label>
				<div className='relative'>
					<Input
						id='password'
						type={showPassword ? 'text' : 'password'}
						value={password}
						onChange={e => setPassword(e.target.value)}
						required
						minLength={8}
						placeholder='••••••••'
						autoComplete='current-password'
						className='pr-10'
					/>
					<Button
						type='button'
						variant='icon'
						size='icon-sm'
						className='absolute right-2 top-1/2 -translate-y-1/2'
						aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
						onClick={() => setShowPassword(prev => !prev)}
					>
						{showPassword ? (
							<EyeOff className='h-4 w-4' />
						) : (
							<Eye className='h-4 w-4' />
						)}
					</Button>
				</div>
			</div>

			<Button
				type='submit'
				variant='primary'
				size='lg'
				fullWidth
				disabled={loading}
			>
				{loading ? 'Вход...' : 'Войти'}
			</Button>

			<p className='text-center text-sm text-muted-foreground'>
				Нет аккаунта?{' '}
				<Link
					href={
						searchParams.get('callbackUrl')
							? `/register?callbackUrl=${encodeURIComponent(
									searchParams.get('callbackUrl')!,
								)}`
							: '/register'
					}
					className='text-primary hover:underline'
				>
					Зарегистрироваться
				</Link>
			</p>
		</form>
	)
}
