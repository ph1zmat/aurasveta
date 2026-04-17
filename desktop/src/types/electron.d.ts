declare global {
	interface Window {
		electronAPI: {
			store: {
				get: (key: string) => Promise<unknown>
				set: (key: string, value: unknown) => Promise<void>
			}
			notification: {
				show: (
					title: string,
					body: string,
					data?: Record<string, string>,
				) => Promise<void>
				playSound: () => Promise<void>
				diagnose: () => Promise<Record<string, unknown>>
			}
			onNavigate: (callback: (path: string) => void) => void
		}
	}
}

export {}
