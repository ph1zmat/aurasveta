type AdminEvent =
	| {
			type: 'order.created'
			orderId: string
			total?: number
			createdAt: string
	  }
	| {
			type: 'ping'
			ts: string
	  }

type Listener = (event: AdminEvent) => void

class AdminEventBus {
	private listeners = new Set<Listener>()

	subscribe(listener: Listener) {
		this.listeners.add(listener)
		return () => this.listeners.delete(listener)
	}

	publish(event: AdminEvent) {
		for (const listener of this.listeners) listener(event)
	}
}

declare global {
	var __adminEventBus: AdminEventBus | undefined
}

export const adminEventBus =
	globalThis.__adminEventBus ?? (globalThis.__adminEventBus = new AdminEventBus())

export type { AdminEvent }

