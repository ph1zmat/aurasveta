import { Metadata } from 'next'
import SeoClient from '../SeoClient'

export const metadata: Metadata = {
  title: 'SEO Продвинутые опции',
  description: 'Полный SEO инструментарий для экспертов',
}

export default function SeoAdvancedPage() {
  return <SeoClient />
}
