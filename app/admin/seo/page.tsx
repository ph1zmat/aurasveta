'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SeoHealthPanel } from './_components/seo-health-panel'
import { SeoEditorTab } from './_components/seo-editor-tab'
import { SeoBulkTab } from './_components/seo-bulk-tab'
import { SeoHistoryTab } from './_components/seo-history-tab'

export default function SeoPage() {
	const [activeTab, setActiveTab] = useState('editor')

	return (
		<div className='space-y-6 max-w-6xl mx-auto'>
			<SeoHealthPanel onSwitchToBulkTab={() => setActiveTab('bulk')} />

			<div className='bg-card border rounded-lg'>
				<Tabs value={activeTab} onValueChange={setActiveTab}>
					<TabsList className='w-full justify-start rounded-none border-b bg-transparent px-4 h-11'>
						<TabsTrigger value='editor' className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 py-0 mr-6 h-11 text-sm'>
							Редактор
						</TabsTrigger>
						<TabsTrigger value='bulk' className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 py-0 mr-6 h-11 text-sm'>
							Массовая генерация
						</TabsTrigger>
						<TabsTrigger value='history' className='rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent px-0 py-0 mr-6 h-11 text-sm'>
							История
						</TabsTrigger>
					</TabsList>
					<div className='p-4'>
						<TabsContent value='editor' className='mt-0'><SeoEditorTab /></TabsContent>
						<TabsContent value='bulk' className='mt-0'><SeoBulkTab /></TabsContent>
						<TabsContent value='history' className='mt-0'><SeoHistoryTab /></TabsContent>
					</div>
				</Tabs>
			</div>
		</div>
	)
}
