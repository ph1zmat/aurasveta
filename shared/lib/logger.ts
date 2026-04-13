type LogLevel = 'info' | 'warn' | 'error'

function formatMessage(
	level: LogLevel,
	message: string,
	meta?: Record<string, unknown>,
): string {
	const timestamp = new Date().toISOString()
	const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
	return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`
}

export const logger = {
	info(message: string, meta?: Record<string, unknown>) {
		console.log(formatMessage('info', message, meta))
	},

	warn(message: string, meta?: Record<string, unknown>) {
		console.warn(formatMessage('warn', message, meta))
	},

	error(message: string, error?: unknown, meta?: Record<string, unknown>) {
		const errorMeta: Record<string, unknown> = { ...meta }
		if (error instanceof Error) {
			errorMeta.errorMessage = error.message
			errorMeta.stack = error.stack
		}
		const formatted = formatMessage('error', message, errorMeta)
		console.error(formatted)
		if (typeof process !== 'undefined' && process.stderr) {
			process.stderr.write(formatted + '\n')
		}
	},
}
