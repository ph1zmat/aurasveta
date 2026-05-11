import { createTRPCRouter } from '../init'
import { sectionTypeRouter } from './sectiontype'
import { homeSectionRouter } from './homesection'
import { propertiesRouter } from './properties'
import { pagesRouter } from './pages'
import { settingRouter } from './setting'

export const cmsRouter = createTRPCRouter({
	sectionType: sectionTypeRouter,
	homeSection: homeSectionRouter,
	property: propertiesRouter,
	page: pagesRouter,
	setting: settingRouter,
})
