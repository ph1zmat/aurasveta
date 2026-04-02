'use client'

import CategoryTree from '@/components/catalog/CategoryTree'
import type { CategoryTreeItem } from '@/components/catalog/CategoryTree'
import FilterSection, {
	FilterSubItem,
	CheckboxFilterItem,
} from '@/components/catalog/FilterSection'

interface CatalogSidebarProps {
	categoryTree: CategoryTreeItem[]
	activeCategoryPath?: string
}

export default function CatalogSidebar({
	categoryTree,
	activeCategoryPath,
}: CatalogSidebarProps) {
	return (
		<aside className='w-full space-y-0'>
			{/* Category tree */}
			<CategoryTree
				title='Категории'
				items={categoryTree}
				activePath={activeCategoryPath}
			/>

			{/* Filters heading */}
			<div className='border-b border-border py-4'>
				<h3 className='text-sm font-bold uppercase tracking-wider text-foreground'>
					Фильтры
				</h3>
			</div>

			{/* Quick checkbox filters */}
			<div className='border-b border-border py-4 space-y-1'>
				<CheckboxFilterItem label='Новинки' />
				<CheckboxFilterItem label='Товары со скидкой' />
				<CheckboxFilterItem label='Бесплатная доставка' />
			</div>

			<FilterSection title='Цена' />

			<FilterSection title='Размеры' defaultOpen>
				<div className='space-y-0'>
					<FilterSubItem label='Высота, мм' />
					<FilterSubItem label='Диаметр, мм' />
					<FilterSubItem label='Ширина, мм' />
					<FilterSubItem label='Длина, мм' />
				</div>
			</FilterSection>

			<FilterSection title='Стиль' />

			<FilterSection title='Цвет' defaultOpen>
				<div className='space-y-0'>
					<FilterSubItem label='Цвет плафона/абажура' />
					<FilterSubItem label='Цвет арматуры' />
				</div>
			</FilterSection>

			<FilterSection title='Место применения' defaultOpen>
				<div className='space-y-0'>
					<FilterSubItem label='Расположение' />
					<FilterSubItem label='Место в интерьере' />
				</div>
			</FilterSection>

			<FilterSection title='Производитель' />
			<FilterSection title='Площадь освещения М²' />

			<FilterSection title='Параметры ламп' defaultOpen>
				<div className='space-y-0'>
					<FilterSubItem label='Вид ламп' />
					<FilterSubItem label='Цоколь' />
					<FilterSubItem label='Доп цоколь' />
					<FilterSubItem label='Количество ламп' />
					<FilterSubItem label='Мощность лампы, W' />
					<FilterSubItem label='Общая мощность, W' />
				</div>
			</FilterSection>

			<FilterSection title='Страна' />

			<FilterSection title='Параметры плафона' defaultOpen>
				<div className='space-y-0'>
					<FilterSubItem label='Материал плафона/абажура' />
					<FilterSubItem label='Форма плафона' />
					<FilterSubItem label='Количество плафонов/абажуров' />
					<FilterSubItem label='Направление абажуров/плафонов' />
				</div>
			</FilterSection>

			<FilterSection title='Материал арматуры' />
			<FilterSection title='Пульт ДУ' />
			<FilterSection title='Степень защиты (IP)' />
			<FilterSection title='Возможность подключения диммера' />
			<FilterSection title='Диаметр врезного отверстия, мм' />
			<FilterSection title='Для натяжных потолков' />
			<FilterSection title='Цвет свечения' />
			<FilterSection title='Для низких потолков' />
			<FilterSection title='Умный дом' />
			<FilterSection title='Уценка' />
			<FilterSection title='Тип управления' />
			<FilterSection title='Протокол связи' />
			<FilterSection title='Источник питания' />
			<FilterSection title='Количество фаз' />
			<FilterSection title='Направленный свет' />
			<FilterSection title='Угол рассеивания' />
			<FilterSection title='Наличие датчика движения' />
			<FilterSection title='Тип монтажа' />
			<FilterSection title='Тип шинопровода' />
			<FilterSection title='Индекс цветопередачи, Ra' />
			<FilterSection title='Тип подвеса' />
			<FilterSection title='Для гипсокартонных потолков' />
		</aside>
	)
}
