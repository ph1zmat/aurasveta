export { generateMetadata, generateStaticParams } from '../pages/[slug]/page'
import ContentPage from '../pages/[slug]/page'

export const revalidate = 3600
export const dynamicParams = false

export default ContentPage
