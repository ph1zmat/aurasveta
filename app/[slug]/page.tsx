export { generateMetadata, generateStaticParams } from '../pages/[slug]/page'
import ContentPage from '../pages/[slug]/page'

export const revalidate = 3600

export default ContentPage
