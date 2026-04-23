import { useState, useEffect } from 'react'
import {
	View,
	Text,
	ScrollView,
	Switch,
	StyleSheet,
	Alert,
	KeyboardAvoidingView,
	Platform,
} from 'react-native'
import { trpc } from '../lib/trpc'
import {
	colors,
	fontSize,
	fontWeight,
	fontFamily,
	spacing,
	borderRadius,
} from '../theme'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ImagePicker } from '../components/ui/ImagePicker'
import { X } from 'lucide-react-native'
import type { ProductFormProps } from '../navigation/types'

function generateSlug(text: string) {
	const map: Record<string, string> = {
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ё: 'yo',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'y',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'h',
		ц: 'ts',
		ч: 'ch',
		ш: 'sh',
		щ: 'shch',
		ъ: '',
		ы: 'y',
		ь: '',
		э: 'e',
		ю: 'yu',
		я: 'ya',
	}
	return text
		.toLowerCase()
		.split('')
		.map(c => map[c] ?? c)
		.join('')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
}

interface PropertyValue {
	propertyId: string
	value: string
}

function getProductImageValue(
	image:
		| {
				key?: string | null
				url?: string | null
				displayUrl?: string | null
				imageAsset?: { url?: string | null } | null
		  }
		| null
		| undefined,
) {
	return image?.displayUrl ?? image?.imageAsset?.url ?? image?.key ?? image?.url ?? null
}

export function ProductFormScreen({ navigation, route }: ProductFormProps) {
	const editId = route.params?.id
	const isEdit = !!editId

	const [name, setName] = useState('')
	const [slug, setSlug] = useState('')
	const [price, setPrice] = useState('')
	const [compareAtPrice, setCompareAtPrice] = useState('')
	const [stock, setStock] = useState('')
	const [sku, setSku] = useState('')
	const [description, setDescription] = useState('')
	const [categoryId, setCategoryId] = useState('')
	const [brand, setBrand] = useState('')
	const [brandCountry, setBrandCountry] = useState('')
	const [isActive, setIsActive] = useState(true)
	const [propertyValues, setPropertyValues] = useState<PropertyValue[]>([])
	const [localImagePath, setLocalImagePath] = useState<string | null>(null)
	const [saving, setSaving] = useState(false)

	const { data: categories } = trpc.categories.getAll.useQuery()
	const { data: properties } = trpc.properties.getAll.useQuery()
	const { data: existing } = trpc.products.getById.useQuery(editId!, {
		enabled: !!editId,
	})
	const utils = trpc.useUtils()

	const createMut = trpc.products.create.useMutation({
		onSuccess: () => {
			utils.products.getMany.invalidate()
			navigation.goBack()
		},
	})
	const updateMut = trpc.products.update.useMutation({
		onSuccess: () => {
			utils.products.getMany.invalidate()
			navigation.goBack()
		},
	})
	const updateImageMut = trpc.products.updateImagePath.useMutation({
		onSuccess: () => {
			if (editId) utils.products.getById.invalidate(editId)
		},
	})
	const removeImageMut = trpc.products.removeImage.useMutation({
		onSuccess: () => {
			if (editId) utils.products.getById.invalidate(editId)
		},
	})

	useEffect(() => {
		if (existing) {
			setName(existing.name || '')
			setSlug(existing.slug || '')
			setPrice(String(existing.price ?? ''))
			setCompareAtPrice(String(existing.compareAtPrice ?? ''))
			setStock(String(existing.stock ?? ''))
			setSku(existing.sku || '')
			setDescription(existing.description || '')
			setCategoryId(existing.categoryId || '')
			setBrand(existing.brand || '')
			setBrandCountry(existing.brandCountry || '')
			setIsActive(existing.isActive ?? true)
			if (existing.propertyValues?.length) {
				setPropertyValues(
					existing.propertyValues.map((pv: any) => ({
						propertyId: pv.propertyId,
						value: pv.value,
					})),
				)
			}
		}
	}, [existing])

	const handleNameChange = (text: string) => {
		setName(text)
		if (!isEdit) setSlug(generateSlug(text))
	}

	const handleSave = async () => {
		if (!name.trim()) {
			Alert.alert('Ошибка', 'Введите название товара')
			return
		}
		if (!price) {
			Alert.alert('Ошибка', 'Введите цену')
			return
		}

		setSaving(true)
		try {
			const payload = {
				name: name.trim(),
				slug: slug.trim(),
				price: parseFloat(price),
				compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
				stock: stock ? parseInt(stock) : 0,
				sku: sku.trim() || null,
				description: description.trim() || null,
				categoryId: categoryId || null,
				brand: brand.trim() || null,
				brandCountry: brandCountry.trim() || null,
				isActive,
				propertyValues: propertyValues.filter(pv => pv.propertyId && pv.value),
			}

			if (isEdit) {
				await updateMut.mutateAsync({ id: editId!, ...payload })
			} else {
				await createMut.mutateAsync({
					...payload,
					images: localImagePath ? [localImagePath] : [],
				} as any)
			}
		} catch (err) {
			Alert.alert(
				'Ошибка',
				err instanceof Error ? err.message : 'Не удалось сохранить',
			)
		} finally {
			setSaving(false)
		}
	}

	const addProperty = () => {
		setPropertyValues(prev => [...prev, { propertyId: '', value: '' }])
	}

	const updateProperty = (
		index: number,
		field: 'propertyId' | 'value',
		val: string,
	) => {
		setPropertyValues(prev =>
			prev.map((pv, i) => (i === index ? { ...pv, [field]: val } : pv)),
		)
	}

	const removeProperty = (index: number) => {
		setPropertyValues(prev => prev.filter((_, i) => i !== index))
	}

	const categoryOptions = (categories ?? []).map((c: any) => ({
		label: c.name,
		value: c.id,
	}))
	const propertyOptions = (properties ?? []).map((p: any) => ({
		label: `${p.name} (${p.type})`,
		value: p.id,
	}))

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
		>
			<ScrollView
				style={styles.container}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps='handled'
			>
				{/* Image */}
				<View style={styles.field}>
					<Text style={styles.label}>Изображение</Text>
					<ImagePicker
						imageUrl={
							isEdit
								? getProductImageValue((existing as any)?.images?.[0])
								: localImagePath
						}
						onImageUploaded={path =>
							isEdit
								? updateImageMut.mutate({ productId: editId!, imagePath: path })
								: setLocalImagePath(path)
						}
						onImageRemoved={() =>
							isEdit ? removeImageMut.mutate(editId!) : setLocalImagePath(null)
						}
					/>
				</View>

				{/* Basic fields */}
				<Input
					label='Название *'
					value={name}
					onChangeText={handleNameChange}
					containerStyle={styles.field}
				/>
				<Input
					label='Slug'
					value={slug}
					onChangeText={setSlug}
					containerStyle={styles.field}
				/>

				<View style={styles.row}>
					<Input
						label='Цена ₽ *'
						value={price}
						onChangeText={setPrice}
						keyboardType='numeric'
						containerStyle={[styles.field, { flex: 1 }]}
					/>
					<Input
						label='Старая цена'
						value={compareAtPrice}
						onChangeText={setCompareAtPrice}
						keyboardType='numeric'
						containerStyle={[styles.field, { flex: 1, marginLeft: spacing.sm }]}
					/>
				</View>

				<View style={styles.row}>
					<Input
						label='Остаток'
						value={stock}
						onChangeText={setStock}
						keyboardType='numeric'
						containerStyle={[styles.field, { flex: 1 }]}
					/>
					<Input
						label='Артикул (SKU)'
						value={sku}
						onChangeText={setSku}
						containerStyle={[styles.field, { flex: 1, marginLeft: spacing.sm }]}
					/>
				</View>

				<Input
					label='Описание'
					value={description}
					onChangeText={setDescription}
					multiline
					numberOfLines={4}
					style={{ height: 100, textAlignVertical: 'top' }}
					containerStyle={styles.field}
				/>

				<View style={styles.field}>
					<Select
						label='Категория'
						options={categoryOptions}
						value={categoryId}
						onValueChange={setCategoryId}
						placeholder='Без категории'
					/>
				</View>

				<View style={styles.row}>
					<Input
						label='Бренд'
						value={brand}
						onChangeText={setBrand}
						containerStyle={[styles.field, { flex: 1 }]}
					/>
					<Input
						label='Страна'
						value={brandCountry}
						onChangeText={setBrandCountry}
						containerStyle={[styles.field, { flex: 1, marginLeft: spacing.sm }]}
					/>
				</View>

				{/* Active toggle */}
				<View style={styles.switchRow}>
					<Text style={styles.label}>Активный</Text>
					<Switch
						value={isActive}
						onValueChange={setIsActive}
						trackColor={{ true: colors.primary }}
						thumbColor={colors.white}
					/>
				</View>

				{/* Properties */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Свойства</Text>
					{propertyValues.map((pv, i) => {
						const prop = (properties ?? []).find(
							(p: any) => p.id === pv.propertyId,
						) as any
						return (
							<View key={i} style={styles.propRow}>
								<View style={{ flex: 1 }}>
									<Select
										options={propertyOptions}
										value={pv.propertyId}
										onValueChange={val => updateProperty(i, 'propertyId', val)}
										placeholder='Свойство...'
									/>
								</View>
								<View style={{ flex: 1, marginLeft: spacing.sm }}>
									{prop?.type === 'SELECT' ? (
										<Select
											options={(prop.options ?? []).map((o: string) => ({
												label: o,
												value: o,
											}))}
											value={pv.value}
											onValueChange={val => updateProperty(i, 'value', val)}
											placeholder='Значение...'
										/>
									) : prop?.type === 'BOOLEAN' ? (
										<Select
											options={[
												{ label: 'Да', value: 'true' },
												{ label: 'Нет', value: 'false' },
											]}
											value={pv.value}
											onValueChange={val => updateProperty(i, 'value', val)}
											placeholder='Значение...'
										/>
									) : (
										<Input
											value={pv.value}
											onChangeText={val => updateProperty(i, 'value', val)}
											placeholder='Значение...'
											keyboardType={
												prop?.type === 'NUMBER' ? 'numeric' : 'default'
											}
										/>
									)}
								</View>
								<IconButton
									icon={<X size={16} color={colors.mutedForeground} />}
									onPress={() => removeProperty(i)}
									accessibilityLabel='Удалить свойство'
									style={{ marginLeft: spacing.xs }}
								/>
							</View>
						)
					})}
					<Button
						title='+ Добавить свойство'
						variant='secondary'
						size='sm'
						onPress={addProperty}
						style={{ marginTop: spacing.sm }}
					/>
				</View>

				{/* Save */}
				<Button
					title={isEdit ? 'Сохранить' : 'Создать товар'}
					onPress={handleSave}
					loading={saving}
					style={{ marginTop: spacing.xl }}
				/>
				<View style={{ height: spacing['2xl'] }} />
			</ScrollView>
		</KeyboardAvoidingView>
	)
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: colors.background },
	content: { padding: spacing.lg },
	field: { marginBottom: spacing.md },
	row: { flexDirection: 'row', marginBottom: spacing.md },
	label: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
		color: colors.mutedForeground,
		marginBottom: spacing.xs,
	},
	switchRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.lg,
		paddingVertical: spacing.sm,
	},
	section: { marginTop: spacing.lg, marginBottom: spacing.md },
	sectionTitle: {
		fontFamily: fontFamily.base,
		fontSize: fontSize.base,
		fontWeight: fontWeight.semibold,
		color: colors.foreground,
		marginBottom: spacing.md,
	},
	propRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: spacing.sm,
	},
})
