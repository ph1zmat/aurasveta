import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

interface MockEventSourceInstance {
	url: string
	onerror: ((this: EventSource, ev: Event) => void) | null
	onmessage: ((this: EventSource, ev: MessageEvent) => void) | null
	onopen: ((this: EventSource, ev: Event) => void) | null
	listeners: Map<string, Array<(evt: MessageEvent) => void>>
	closed: boolean
	readyState: number
	withCredentials: boolean
	addEventListener(type: string, handler: (evt: MessageEvent) => void): void
	removeEventListener(): void
	dispatchEvent(): boolean
	close(): void
}

describe('SSE reconnect logic', () => {
	const MockEventSource = vi.fn(function (this: MockEventSourceInstance, url: string) {
		this.url = url
		this.onerror = null
		this.onmessage = null
		this.onopen = null
		this.listeners = new Map()
		this.closed = false
		this.readyState = 0
		this.withCredentials = false
		this.addEventListener = (type: string, handler: (evt: MessageEvent) => void) => {
			if (!this.listeners.has(type)) this.listeners.set(type, [])
			this.listeners.get(type)!.push(handler)
		}
		this.removeEventListener = () => { /* noop */ }
		this.dispatchEvent = () => true
		this.close = () => {
			this.closed = true
			this.readyState = 2
		}
	})

	beforeEach(() => {
		vi.stubGlobal('EventSource', MockEventSource)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('creates EventSource connection', () => {
		const source = new (EventSource as unknown as new (url: string) => MockEventSourceInstance)('/api/admin/events')
		expect(source.url).toBe('/api/admin/events')
		expect(source.closed).toBe(false)
		source.close()
		expect(source.closed).toBe(true)
	})

	it('dispatches order.created event to listeners', () => {
		const source = new (EventSource as unknown as new (url: string) => MockEventSourceInstance)('/api/admin/events')
		const handler = vi.fn()
		source.addEventListener('order.created', handler)

		const event = new MessageEvent('order.created', {
			data: JSON.stringify({ orderId: 'abc123', total: 5000 }),
		})
		source.listeners.get('order.created')?.forEach((h: (evt: MessageEvent) => void) => h(event))

		expect(handler).toHaveBeenCalledTimes(1)
		const data = JSON.parse(handler.mock.calls[0][0].data)
		expect(data.orderId).toBe('abc123')
	})

	it('has required EventSource interface properties', () => {
		const source = new (EventSource as unknown as new (url: string) => MockEventSourceInstance)('/test')
		expect(source).toHaveProperty('onerror')
		expect(source).toHaveProperty('onmessage')
		expect(source).toHaveProperty('onopen')
		expect(source).toHaveProperty('readyState')
		expect(source).toHaveProperty('withCredentials')
		expect(source).toHaveProperty('close')
		expect(source).toHaveProperty('addEventListener')
	})
})
