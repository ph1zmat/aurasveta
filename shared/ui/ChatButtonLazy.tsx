/**
 * Lazy-версия ChatButton с ssr: false.
 * Используй вместо ChatButton в RSC-страницах — floating button не нужен в SSR HTML.
 */
import dynamic from 'next/dynamic'

const ChatButtonLazy = dynamic(() => import('./ChatButton'), { ssr: false })

export default ChatButtonLazy
