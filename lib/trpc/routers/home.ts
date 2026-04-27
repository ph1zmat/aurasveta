import { createTRPCRouter, baseProcedure } from '../init'

export const homeRouter = createTRPCRouter({
	getSections: baseProcedure.query(async ({ ctx }) => {
		return ctx.prisma.homeSection.findMany({
			where: { isActive: true },
			orderBy: { order: 'asc' },
			include: { sectionType: true },
		})
	}),
})
