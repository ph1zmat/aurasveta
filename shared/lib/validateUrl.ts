const PRIVATE_IP_RANGES = [
	// 10.0.0.0/8
	{ start: 0x0a000000, end: 0x0affffff },
	// 172.16.0.0/12
	{ start: 0xac100000, end: 0xac1fffff },
	// 192.168.0.0/16
	{ start: 0xc0a80000, end: 0xc0a8ffff },
	// 127.0.0.0/8
	{ start: 0x7f000000, end: 0x7fffffff },
	// 169.254.0.0/16 (link-local, metadata)
	{ start: 0xa9fe0000, end: 0xa9feffff },
	// 0.0.0.0/8
	{ start: 0x00000000, end: 0x00ffffff },
]

function ipToInt(ip: string): number | null {
	const parts = ip.split('.')
	if (parts.length !== 4) return null
	let result = 0
	for (const part of parts) {
		const num = parseInt(part, 10)
		if (isNaN(num) || num < 0 || num > 255) return null
		result = (result << 8) + num
	}
	return result >>> 0 // unsigned
}

function isPrivateIp(ip: string): boolean {
	const num = ipToInt(ip)
	if (num === null) return false
	return PRIVATE_IP_RANGES.some(range => num >= range.start && num <= range.end)
}

const BLOCKED_HOSTNAMES = ['localhost', 'metadata.google.internal']

export function validateWebhookUrl(url: string): {
	valid: boolean
	reason?: string
} {
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return { valid: false, reason: 'Невалидный URL' }
	}

	// Only allow http/https
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return { valid: false, reason: 'Разрешены только HTTP/HTTPS протоколы' }
	}

	const hostname = parsed.hostname.toLowerCase()

	// Block known dangerous hostnames
	if (BLOCKED_HOSTNAMES.includes(hostname)) {
		return { valid: false, reason: `Запрещённый хост: ${hostname}` }
	}

	// Check if hostname is an IP address
	if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
		if (isPrivateIp(hostname)) {
			return { valid: false, reason: 'Запрещены приватные IP-адреса' }
		}
	}

	// Block IPv6 localhost
	if (hostname === '[::1]' || hostname === '::1') {
		return { valid: false, reason: 'Запрещены локальные адреса' }
	}

	return { valid: true }
}
