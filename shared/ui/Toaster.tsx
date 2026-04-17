'use client'

import { Toaster as SonnerToaster } from 'sonner'

export default function Toaster() {
	return (
		<SonnerToaster
			position='top-center'
			richColors
			closeButton
			toastOptions={{
				duration: 3500,
			}}
		/>
	)
}

