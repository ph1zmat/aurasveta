import { getPublicStoreSettings } from '@/lib/utils/getPublicStoreSettings'
import Header from './Header'

/**
 * RSC-обёртка над Header.
 * Читает настройки магазина из БД и передаёт URL логотипа в Client Component.
 * Используйте этот компонент вместо Header напрямую в page.tsx.
 */
export default async function HeaderServer() {
	const settings = await getPublicStoreSettings()
	return <Header logoUrl={settings?.logoUrl} />
}
