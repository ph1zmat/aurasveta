import {
	app,
	BrowserWindow,
	Notification,
	ipcMain,
	nativeImage,
	shell,
} from 'electron'
import path from 'node:path'
import { exec, execFile } from 'node:child_process'
import { existsSync, writeFileSync, mkdirSync, unlinkSync } from 'node:fs'
import Store from 'electron-store'

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const defaultApiUrl = isDev ? 'http://127.0.0.1:3000' : 'https://aurasveta.ru'

const store = new Store<{
	apiUrl: string
	sessionToken: string | null
	windowBounds: { width: number; height: number; x?: number; y?: number }
}>({
	defaults: {
		apiUrl: defaultApiUrl,
		sessionToken: null,
		windowBounds: { width: 1280, height: 800 },
	},
})

let mainWindow: BrowserWindow | null = null
let lastOrderId: string | null = null
let sseConnectedOnce = false
let lastWaitForAuthLogAt = 0

const gotSingleInstanceLock = isDev ? true : app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
	app.quit()
}

function log(...args: unknown[]) {
	// eslint-disable-next-line no-console
	console.log('[DesktopListener]', ...args)
}

// ───────────────────────────── Notification Sound ─────────────────────────────

/** Path to bundled / generated resources directory */
function getResourcesDir(): string {
	return isDev ? path.join(__dirname, '../resources') : process.resourcesPath
}

function getNotificationSoundPath(): string {
	return path.join(getResourcesDir(), 'notification.wav')
}

/**
 * Generate a pleasant two-tone notification chime (similar to Telegram).
 * The WAV is created once and reused on subsequent launches.
 *
 * Two ascending notes: C6 → E6, ~400 ms total, 44100 Hz / 16-bit mono.
 */
function ensureNotificationSound(): void {
	const soundPath = getNotificationSoundPath()
	if (existsSync(soundPath)) return

	const dir = path.dirname(soundPath)
	if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

	const sampleRate = 44100
	const duration = 0.4
	const numSamples = Math.floor(sampleRate * duration)
	const dataSize = numSamples * 2 // 16-bit = 2 bytes per sample

	const buf = Buffer.alloc(44 + dataSize)

	// ── WAV header (44 bytes) ──
	buf.write('RIFF', 0)
	buf.writeUInt32LE(36 + dataSize, 4)
	buf.write('WAVE', 8)
	buf.write('fmt ', 12)
	buf.writeUInt32LE(16, 16) // PCM sub-chunk size
	buf.writeUInt16LE(1, 20) // Audio format: PCM
	buf.writeUInt16LE(1, 22) // Channels: mono
	buf.writeUInt32LE(sampleRate, 24)
	buf.writeUInt32LE(sampleRate * 2, 28) // Byte rate
	buf.writeUInt16LE(2, 32) // Block align
	buf.writeUInt16LE(16, 34) // Bits per sample
	buf.write('data', 36)
	buf.writeUInt32LE(dataSize, 40)

	// ── Audio data: two ascending tones ──
	for (let i = 0; i < numSamples; i++) {
		const t = i / sampleRate
		const progress = i / numSamples

		// Note 1: C6 (1047 Hz) first half, Note 2: E6 (1319 Hz) second half
		const freq = progress < 0.45 ? 1047.0 : 1318.5

		// Smooth envelope: 5 ms attack, cosine fade-out
		const attackEnd = 0.005 * sampleRate
		const attack = i < attackEnd ? i / attackEnd : 1.0
		const decay = Math.pow(Math.cos((progress * Math.PI) / 2.2), 1.4)
		const envelope = attack * decay

		// Fundamental + overtones for warmth
		const sample =
			(Math.sin(2 * Math.PI * freq * t) * 0.6 +
				Math.sin(2 * Math.PI * freq * 2 * t) * 0.18 +
				Math.sin(2 * Math.PI * freq * 3 * t) * 0.08) *
			envelope *
			0.75

		buf.writeInt16LE(
			Math.max(-32768, Math.min(32767, Math.round(sample * 32767))),
			44 + i * 2,
		)
	}

	writeFileSync(soundPath, buf)
	log('notification sound generated →', soundPath)
}

/**
 * Play the notification sound file using platform-native CLI tools.
 * Runs in a child process so the main thread is never blocked.
 */
function playNotificationSound(): void {
	const soundPath = getNotificationSoundPath()
	if (!existsSync(soundPath)) {
		log('notification sound missing, skipping playback')
		return
	}

	switch (process.platform) {
		case 'win32': {
			// PowerShell's System.Media.SoundPlayer — always available on Windows
			const escaped = soundPath.replace(/'/g, "''")
			exec(
				`powershell -NoProfile -NonInteractive -Command "(New-Object System.Media.SoundPlayer '${escaped}').PlaySync()"`,
				{ timeout: 5_000 },
				err => {
					if (err) log('sound error (win32):', err.message)
				},
			)
			break
		}
		case 'darwin':
			execFile('afplay', [soundPath], { timeout: 5_000 }, err => {
				if (err) log('sound error (darwin):', err.message)
			})
			break
		default:
			// Linux: try PulseAudio first, fall back to ALSA
			exec(
				`paplay "${soundPath}" 2>/dev/null || aplay "${soundPath}" 2>/dev/null`,
				{ timeout: 5_000 },
				err => {
					if (err) log('sound error (linux):', err.message)
				},
			)
			break
	}
}

// ───────────────────────────── App Icon ───────────────────────────────────────

/** Resolve the raw square icon file. */
function getAppIconPath(): string | undefined {
	const candidates = [
		path.join(__dirname, '../resources/icon.png'),
		path.join(process.resourcesPath ?? '', 'icon.png'),
		path.join(__dirname, '../public/icon.png'),
		path.join(__dirname, '../dist/icon.png'),
		path.resolve(app.getAppPath(), 'icon.png'),
	]
	return candidates.find(p => existsSync(p))
}

/** Cached circular icon (created once per session). */
let circularIconCache: Electron.NativeImage | null = null

/**
 * Create a circular-cropped version of the square icon using nativeImage.
 * Returns a 256×256 circle with transparent corners — suitable for
 * Windows taskbar, toast, macOS Notification Center, and Linux libnotify.
 */
function getCircularIcon(): Electron.NativeImage | undefined {
	if (circularIconCache) return circularIconCache

	const iconPath = getAppIconPath()
	if (!iconPath) return undefined

	try {
		const raw = nativeImage.createFromPath(iconPath)
		if (raw.isEmpty()) return undefined

		const size = 256
		const resized = raw.resize({ width: size, height: size, quality: 'best' })
		const bitmap = resized.toBitmap()

		// bitmap is BGRA, size×size×4 bytes
		const r = size / 2
		for (let y = 0; y < size; y++) {
			for (let x = 0; x < size; x++) {
				const dx = x - r + 0.5
				const dy = y - r + 0.5
				if (dx * dx + dy * dy > r * r) {
					// Set alpha to 0 (transparent) — 4th byte in BGRA
					bitmap[(y * size + x) * 4 + 3] = 0
				}
			}
		}

		circularIconCache = nativeImage.createFromBitmap(bitmap, {
			width: size,
			height: size,
		})
		log('circular icon created', size, 'px')
		return circularIconCache
	} catch (err) {
		log('circular icon error:', err)
		return undefined
	}
}

/**
 * Save the circular icon as a .ico file in resources dir.
 * Windows uses this for the Start Menu shortcut (and therefore toast icon).
 */
function ensureCircularIco(): string | undefined {
	const icoPath = path.join(getResourcesDir(), 'icon-round.ico')

	const icon = getCircularIcon()
	if (!icon) return undefined

	try {
		const png = icon.toPNG()

		// ICO format: 6-byte header + 16-byte dir entry + embedded PNG data
		const header = Buffer.alloc(6)
		header.writeUInt16LE(0, 0) // Reserved
		header.writeUInt16LE(1, 2) // Type: 1 = ICO
		header.writeUInt16LE(1, 4) // Number of images: 1

		const dir = Buffer.alloc(16)
		dir.writeUInt8(0, 0) // Width: 0 = 256
		dir.writeUInt8(0, 1) // Height: 0 = 256
		dir.writeUInt8(0, 2) // Color palette: 0
		dir.writeUInt8(0, 3) // Reserved
		dir.writeUInt16LE(1, 4) // Color planes
		dir.writeUInt16LE(32, 6) // Bits per pixel
		dir.writeUInt32LE(png.length, 8) // Image data size
		dir.writeUInt32LE(22, 12) // Offset: 6 + 16 = 22

		const ico = Buffer.concat([header, dir, png])
		writeFileSync(icoPath, ico)
		log('circular .ico saved', icoPath, `(${ico.length} bytes)`)
		return icoPath
	} catch (err) {
		log('ensureCircularIco error:', err)
		return undefined
	}
}

// ──────────────── Windows Start-Menu shortcut (dev mode) ─────────────────────

/**
 * On Windows, Electron's Notification API requires a Start Menu shortcut whose
 * System.AppUserModel.ID matches `app.setAppUserModelId()`.
 *
 * NSIS installer creates one in production, but in dev mode no shortcut exists
 * and notifications silently fail.  This function creates a temporary .lnk so
 * toasts work during development.
 */
let devShortcutPath: string | null = null

function ensureDevStartMenuShortcut(): void {
	if (process.platform !== 'win32' || !isDev) return

	const startMenu = path.join(
		app.getPath('appData'),
		'Microsoft',
		'Windows',
		'Start Menu',
		'Programs',
	)
	devShortcutPath = path.join(startMenu, 'Аура Света CMS Dev.lnk')

	const roundIconPath = ensureCircularIco()

	try {
		// Always overwrite — shortcut may exist from a previous run without icon
		if (existsSync(devShortcutPath)) unlinkSync(devShortcutPath)

		const ok = shell.writeShortcutLink(devShortcutPath, 'create', {
			target: process.execPath,
			appUserModelId: process.execPath,
			description: 'Аура Света CMS (dev)',
			...(roundIconPath ? { icon: roundIconPath, iconIndex: 0 } : {}),
		})
		log('dev Start Menu shortcut', ok ? 'created' : 'exists', devShortcutPath)
	} catch (err) {
		log('dev shortcut error (non-fatal):', err)
	}
}

function removeDevStartMenuShortcut(): void {
	if (!devShortcutPath) return
	try {
		if (existsSync(devShortcutPath)) {
			unlinkSync(devShortcutPath)
			log('dev shortcut cleaned up')
		}
	} catch {
		/* ignore */
	}
}

// ───────────────────────────── Native Notifications ──────────────────────────

const escapeXml = (s: string) =>
	s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')

/**
 * Show a native OS notification **with custom sound**, similar to Telegram.
 *
 * Flow:
 *  1. Play custom notification chime via platform CLI.
 *  2. Flash the taskbar / dock icon if the window is not focused.
 *  3. Show a native OS toast via Electron Notification API.
 */
function showToast(title: string, body: string, onClick?: () => void): void {
	log('showToast', { title, platform: process.platform, isDev })

	// 1. ── Always play custom sound ──
	playNotificationSound()

	// 2. ── Flash taskbar / dock ──
	if (mainWindow && !mainWindow.isFocused()) {
		mainWindow.flashFrame(true)
	}

	// 3. ── Native notification (all platforms, including dev Windows) ──
	showElectronNotification(title, body, onClick)
}

/**
 * Electron's built-in Notification API.
 * Works on production Windows (NSIS installer creates a shortcut),
 * macOS, and Linux.
 */
function showElectronNotification(
	title: string,
	body: string,
	onClick?: () => void,
): void {
	log('showElectronNotification check:', {
		isSupported: Notification.isSupported(),
		platform: process.platform,
		appUserModelId: isDev ? process.execPath : 'ru.aurasveta.cms',
	})

	if (!Notification.isSupported()) {
		log('Notification.isSupported() === false — skipping')
		return
	}

	const opts: Electron.NotificationConstructorOptions = {
		title,
		body,
	}

	const icon = getCircularIcon()
	if (icon) {
		opts.icon = icon
	}

	// Linux: make the notification "critical" so it is not suppressed by DND
	if (process.platform === 'linux') {
		opts.urgency = 'critical'
	}

	try {
		const n = new Notification(opts)
		n.on('show', () => log('notification event: show'))
		n.on('close', () => log('notification event: close'))
		n.on('failed', (_, err) => log('notification event: failed', err))
		if (onClick) {
			n.on('click', () => {
				// Restore & focus window before executing callback
				if (mainWindow) {
					if (mainWindow.isMinimized()) mainWindow.restore()
					mainWindow.show()
					mainWindow.focus()
				}
				onClick()
			})
		}
		n.show()
		log('Electron notification .show() called')
	} catch (err) {
		log('Electron notification error:', err)
	}
}

function normalizeDevServerUrl(url: string) {
	// On Windows, `localhost` may resolve to IPv6 (::1) while Vite is bound to IPv4 only.
	// Normalizing to 127.0.0.1 avoids ERR_CONNECTION_REFUSED in Electron.
	try {
		const u = new URL(url)
		if (u.hostname === 'localhost') u.hostname = '127.0.0.1'
		return u.toString()
	} catch {
		return url.replace('localhost', '127.0.0.1')
	}
}

async function loadDevUrlWithRetry(win: BrowserWindow, url: string) {
	const devUrl = normalizeDevServerUrl(url)
	let attempt = 0
	const maxAttempts = 40 // ~20s @ 500ms

	while (attempt < maxAttempts && !win.isDestroyed()) {
		attempt += 1
		try {
			await win.loadURL(devUrl)
			return
		} catch {
			await new Promise(r => setTimeout(r, 500))
		}
	}

	if (!win.isDestroyed()) {
		await win.loadURL(
			'data:text/html;charset=utf-8,' +
				encodeURIComponent(
					`<div style="font-family:system-ui;padding:24px">
            <h2>Dev server недоступен</h2>
            <p>Не удалось подключиться к <code>${devUrl}</code>.</p>
            <p>Проверь, что Vite запущен и порт доступен.</p>
          </div>`,
				),
		)
	}
}

function createWindow() {
	const bounds = store.get('windowBounds')

	mainWindow = new BrowserWindow({
		width: bounds.width,
		height: bounds.height,
		x: bounds.x,
		y: bounds.y,
		minWidth: 900,
		minHeight: 600,
		title: 'Аура Света CMS',
		icon: getCircularIcon() || getAppIconPath(),
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false,
		},
	})

	// Загрузка Vite dev-server или сборки
	if (process.env.VITE_DEV_SERVER_URL) {
		const url = process.env.VITE_DEV_SERVER_URL
		// If the first navigation fails (race/localhost IPv6), retry a few times.
		mainWindow.webContents.on(
			'did-fail-load',
			(_event, errorCode, errorDescription, validatedURL) => {
				log('did-fail-load', { errorCode, errorDescription, validatedURL })
				if (validatedURL && validatedURL.startsWith('http')) {
					void loadDevUrlWithRetry(mainWindow!, validatedURL)
				}
			},
		)
		void loadDevUrlWithRetry(mainWindow, url)
		mainWindow.webContents.openDevTools()
	} else {
		mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
	}

	// Сохранение размеров окна
	mainWindow.on('close', () => {
		if (mainWindow) {
			const bounds = mainWindow.getBounds()
			store.set('windowBounds', bounds)
		}
	})

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

function encodeSseEventChunk(chunk: string) {
	// SSE frames separated by \n\n
	return chunk
}

async function startDesktopOrderListener() {
	log('listener started', { notificationSupported: Notification.isSupported() })

	// Keep a single loop that reconnects when token/apiUrl become available
	let aborted = false

	app.on('before-quit', () => {
		aborted = true
	})

	while (!aborted) {
		try {
			const apiUrl = String(store.get('apiUrl') || '').replace(/\/+$/, '')
			const token = store.get('sessionToken')

			if (!apiUrl || !token) {
				const now = Date.now()
				// Avoid noisy logs every 2s while user is not authenticated yet.
				if (now - lastWaitForAuthLogAt >= 15000) {
					lastWaitForAuthLogAt = now
					log('waiting for apiUrl/token', {
						apiUrl: apiUrl || null,
						hasToken: Boolean(token),
					})
				}
				await new Promise(r => setTimeout(r, 2000))
				continue
			}

			log('connecting', `${apiUrl}/api/desktop/events`)
			const res = await fetch(`${apiUrl}/api/desktop/events`, {
				headers: { Authorization: `Bearer ${token}` },
			})

			if (!res.ok || !res.body) {
				log('connect failed', res.status, await res.text().catch(() => ''))
				await new Promise(r => setTimeout(r, 2000))
				continue
			}

			log('connected', res.status)
			const reader = res.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ''

			while (!aborted) {
				const { value, done } = await reader.read()
				if (done) break
				buffer += decoder.decode(value, { stream: true })
				buffer = encodeSseEventChunk(buffer)

				let idx: number
				// eslint-disable-next-line no-cond-assign
				while ((idx = buffer.indexOf('\n\n')) >= 0) {
					const raw = buffer.slice(0, idx)
					buffer = buffer.slice(idx + 2)

					const lines = raw.split('\n').map(l => l.trimEnd())
					let eventName = ''
					let dataStr = ''
					for (const line of lines) {
						if (line.startsWith('event:'))
							eventName = line.slice('event:'.length).trim()
						if (line.startsWith('data:'))
							dataStr += line.slice('data:'.length).trim()
					}

					if (eventName === 'ping') {
						if (!sseConnectedOnce) {
							sseConnectedOnce = true
							log('ping ok — connected to notification server')
						}
					}

					if (eventName === 'order.created') {
						try {
							const payload = JSON.parse(dataStr) as {
								orderId?: string
								total?: number
							}
							if (!payload?.orderId) continue
							if (payload.orderId === lastOrderId) continue
							lastOrderId = payload.orderId
							log('order.created', payload.orderId)

							showToast(
								'Новый заказ',
								`Заказ #${String(payload.orderId).slice(-6)} на сумму ${typeof payload.total === 'number' ? payload.total.toLocaleString('ru-RU') : (payload.total ?? '')} ₽`,
								() => {
									mainWindow?.focus()
									mainWindow?.webContents.send(
										'navigate',
										`/orders/${payload.orderId}`,
									)
								},
							)
						} catch (e) {
							log('notification error (order.created)', e)
						}
					}
				}
			}
			log('disconnected (stream ended)')
		} catch (err) {
			log('listener error, reconnecting', String(err))
		}

		await new Promise(r => setTimeout(r, 1500))
	}
}

// IPC handlers
ipcMain.handle('store:get', (_event, key: string) => store.get(key))
ipcMain.handle('store:set', (_event, key: string, value: unknown) => {
	if (key === 'sessionToken') {
		log('sessionToken updated via IPC', {
			hasValue: Boolean(value),
			length: typeof value === 'string' ? value.length : 0,
		})
	}
	store.set(key, value)
})

ipcMain.handle(
	'notification:show',
	(_event, title: string, body: string, data?: Record<string, string>) => {
		showToast(title, body, () => {
			mainWindow?.focus()
			if (data?.orderId) {
				mainWindow?.webContents.send('navigate', `/orders/${data.orderId}`)
			}
		})
	},
)

ipcMain.handle('notification:diagnose', () => {
	const supported = Notification.isSupported()
	const modelId = isDev ? process.execPath : 'ru.aurasveta.cms'
	const iconPath = getAppIconPath()
	const info = {
		supported,
		platform: process.platform,
		isDev,
		appUserModelId: modelId,
		iconPath: iconPath ?? null,
		resourcesPath: process.resourcesPath,
		__dirname,
		devShortcutPath,
	}
	log('notification:diagnose', info)

	// Try showing a basic notification
	if (supported) {
		try {
			const n = new Notification({
				title: 'Диагностика',
				body: 'Тестовое уведомление',
			})
			n.on('show', () => log('diagnose: notification shown ✓'))
			n.on('failed', (_, err) => log('diagnose: notification FAILED', err))
			n.show()
		} catch (err) {
			log('diagnose: notification error:', err)
			return { ...info, error: String(err) }
		}
	}
	return info
})

ipcMain.handle('notification:playSound', () => {
	playNotificationSound()
})

app.whenReady().then(() => {
	try {
		// On Windows, toast notifications require a valid AppUserModelId.
		// In dev mode, 'ru.aurasveta.cms' has no Start Menu shortcut,
		// so Windows won't show toasts. Using process.execPath makes the
		// running Electron binary recognisable to the notification subsystem.
		app.setAppUserModelId(isDev ? process.execPath : 'ru.aurasveta.cms')
	} catch {
		// ignore
	}

	// Windows dev: create Start Menu shortcut so Notification API works
	ensureDevStartMenuShortcut()

	// Generate notification chime WAV on first launch (if not bundled)
	try {
		ensureNotificationSound()
	} catch (err) {
		log('ensureNotificationSound error:', err)
	}

	if (isDev) {
		const apiUrl = String(store.get('apiUrl') || '').replace(/\/+$/, '')
		if (!apiUrl || apiUrl === 'https://aurasveta.ru') {
			store.set('apiUrl', 'http://127.0.0.1:3000')
		}
	}
	createWindow()
	startDesktopOrderListener()
})

if (!isDev) {
	app.on('second-instance', () => {
		if (!mainWindow) return
		if (mainWindow.isMinimized()) mainWindow.restore()
		mainWindow.focus()
	})
}

app.on('before-quit', () => {
	removeDevStartMenuShortcut()
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
