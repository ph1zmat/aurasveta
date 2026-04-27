/**
 * SectionConfigEditor — визуальный редактор конфига секции.
 * Заменяет «голый JSON-textarea» конкретными полями для каждого типа.
 */
import { useCallback, useRef, useState } from 'react'
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ImagePlus,
  Code2,
} from 'lucide-react'
import { Button } from './ui/Button'
import { trpc } from '../lib/trpc'
import { getApiUrl, getToken, resolveImgUrl } from '../lib/store'

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <div className='space-y-1'>
      <label className='block text-xs font-medium text-muted-foreground'>
        {label}
      </label>
      {children}
      {hint && <p className='text-[10px] text-muted-foreground/70'>{hint}</p>}
    </div>
  )
}

const inputCls =
  'h-9 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30'
const selectCls = inputCls + ' cursor-pointer'
const textareaCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 resize-none'

// ─── image upload hook ────────────────────────────────────────────────────────

function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const upload = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)
    try {
      const apiUrl = (await getApiUrl()).replace(/\/+$/, '')
      const token = await getToken()
      if (!token) throw new Error('Нет токена')
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error ?? `Ошибка загрузки: ${res.status}`)
      }
      const out = await res.json()
      const key =
        (out.key as string | undefined) ?? (out.path as string | undefined)
      if (!key) throw new Error('Сервер не вернул ключ')
      return key
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Неизвестная ошибка')
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  return { upload, uploading, error, clearError: () => setError(null) }
}

// ─── SlideImagePicker ─────────────────────────────────────────────────────────

function SlideImagePicker({
  imageKey,
  onChange,
  apiBaseUrl,
}: {
  imageKey?: string
  onChange: (key: string) => void
  apiBaseUrl: string
}) {
  const { upload, uploading, error } = useUpload()
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = imageKey
    ? resolveImgUrl(imageKey, apiBaseUrl)
    : undefined

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const key = await upload(file)
    if (key) onChange(key)
    e.target.value = ''
  }

  return (
    <div>
      <button
        type='button'
        onClick={() => inputRef.current?.click()}
        className={`relative flex h-28 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors
          ${preview ? 'border-transparent' : 'border-border hover:border-primary/50'}`}
      >
        {preview ? (
          <img
            src={preview}
            alt=''
            className='h-full w-full object-cover'
          />
        ) : (
          <div className='flex flex-col items-center gap-1 text-muted-foreground'>
            <ImagePlus className='h-6 w-6' />
            <span className='text-xs'>Загрузить фото</span>
          </div>
        )}
        {uploading && (
          <div className='absolute inset-0 flex items-center justify-center bg-background/70 text-xs text-muted-foreground'>
            Загрузка…
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        onChange={handleFile}
        className='hidden'
      />
      {error && <p className='mt-1 text-[10px] text-destructive'>{error}</p>}
    </div>
  )
}

// ─── BannerConfig ─────────────────────────────────────────────────────────────

interface BannerSlide {
  title?: string
  subtitle?: string
  cta?: string
  href?: string
  imageKey?: string
  bg?: string
}

function BannerConfigEditor({
  value,
  onChange,
  apiBaseUrl,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
  apiBaseUrl: string
}) {
  const slides: BannerSlide[] = Array.isArray(value.slides)
    ? (value.slides as BannerSlide[])
    : [{}]

  function setSlides(next: BannerSlide[]) {
    onChange({ ...value, slides: next })
  }

  function updateSlide(idx: number, patch: Partial<BannerSlide>) {
    const next = slides.map((s, i) => (i === idx ? { ...s, ...patch } : s))
    setSlides(next)
  }

  function addSlide() {
    setSlides([...slides, { title: '', subtitle: '', cta: 'Подробнее', href: '/catalog' }])
  }

  function removeSlide(idx: number) {
    setSlides(slides.filter((_, i) => i !== idx))
  }

  function moveSlide(idx: number, dir: -1 | 1) {
    const next = [...slides]
    const target = idx + dir
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSlides(next)
  }

  const BG_OPTIONS = [
    { label: 'Тёмный', value: 'from-foreground/80 to-foreground/60' },
    { label: 'Основной', value: 'from-primary/80 to-primary/60' },
    { label: 'Тёмный 70%', value: 'from-foreground/70 to-foreground/50' },
    { label: 'Синий', value: 'from-blue-600/80 to-blue-800/80' },
    { label: 'Зелёный', value: 'from-emerald-600/80 to-emerald-800/80' },
  ]

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-medium text-muted-foreground'>
          Слайды ({slides.length})
        </p>
        <Button type='button' variant='secondary' size='sm' onClick={addSlide}>
          <Plus className='mr-1 h-3.5 w-3.5' /> Добавить слайд
        </Button>
      </div>

      <div className='space-y-3'>
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className='rounded-xl border border-border bg-muted/10 p-4 space-y-3'
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-foreground'>
                Слайд {idx + 1}
              </span>
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => moveSlide(idx, -1)}
                  disabled={idx === 0}
                  className='rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
                >
                  <ChevronUp className='h-3.5 w-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => moveSlide(idx, 1)}
                  disabled={idx === slides.length - 1}
                  className='rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30'
                >
                  <ChevronDown className='h-3.5 w-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => removeSlide(idx)}
                  className='rounded p-1 text-destructive/70 hover:text-destructive'
                >
                  <Trash2 className='h-3.5 w-3.5' />
                </button>
              </div>
            </div>

            <SlideImagePicker
              imageKey={slide.imageKey}
              onChange={key => updateSlide(idx, { imageKey: key })}
              apiBaseUrl={apiBaseUrl}
            />

            <div className='grid grid-cols-2 gap-3'>
              <Field label='Заголовок'>
                <input
                  className={inputCls}
                  value={slide.title ?? ''}
                  onChange={e => updateSlide(idx, { title: e.target.value })}
                  placeholder='ПРАВИЛЬНЫЙ СВЕТ'
                />
              </Field>
              <Field label='Подзаголовок'>
                <input
                  className={inputCls}
                  value={slide.subtitle ?? ''}
                  onChange={e => updateSlide(idx, { subtitle: e.target.value })}
                  placeholder='Создайте атмосферу уюта'
                />
              </Field>
              <Field label='Текст кнопки'>
                <input
                  className={inputCls}
                  value={slide.cta ?? ''}
                  onChange={e => updateSlide(idx, { cta: e.target.value })}
                  placeholder='Смотреть каталог'
                />
              </Field>
              <Field label='Ссылка кнопки'>
                <input
                  className={inputCls}
                  value={slide.href ?? ''}
                  onChange={e => updateSlide(idx, { href: e.target.value })}
                  placeholder='/catalog'
                />
              </Field>
            </div>

            {!slide.imageKey && (
              <Field label='Цвет фона (если нет фото)'>
                <select
                  className={selectCls}
                  value={slide.bg ?? BG_OPTIONS[0].value}
                  onChange={e => updateSlide(idx, { bg: e.target.value })}
                >
                  {BG_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        ))}
      </div>

      <div className='grid grid-cols-2 gap-3 border-t border-border pt-3'>
        <Field label='Минимальная высота (px)'>
          <input
            type='number'
            min={160}
            max={600}
            className={inputCls}
            value={(value.minHeight as number | undefined) ?? 280}
            onChange={e =>
              onChange({ ...value, minHeight: Number(e.target.value) })
            }
          />
        </Field>
        <Field label='Автопрокрутка'>
          <div className='flex h-9 items-center gap-3'>
            <label className='flex items-center gap-2 text-sm text-foreground'>
              <input
                type='checkbox'
                checked={Boolean(value.autoPlay)}
                onChange={e =>
                  onChange({ ...value, autoPlay: e.target.checked })
                }
                className='h-4 w-4 rounded accent-primary'
              />
              Включить
            </label>
            {value.autoPlay && (
              <input
                type='number'
                min={1000}
                max={10000}
                step={500}
                className={inputCls}
                style={{ width: 90 }}
                value={(value.autoPlayInterval as number | undefined) ?? 4000}
                onChange={e =>
                  onChange({
                    ...value,
                    autoPlayInterval: Number(e.target.value),
                  })
                }
                title='Интервал (мс)'
              />
            )}
          </div>
        </Field>
      </div>
    </div>
  )
}

// ─── ProductGridConfig ────────────────────────────────────────────────────────

function ProductGridConfigEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const { data: categories } = trpc.categories.getAll.useQuery()
  const { data: properties } = trpc.properties.getAll.useQuery()

  const source = (value.source as string | undefined) ?? 'promotion'
  const selectedPropId = (value._propertyId as string | undefined) ?? ''
  const selectedProp = properties?.find(p => p.id === selectedPropId)

  function set(key: string, val: unknown) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className='space-y-3'>
      <Field label='Источник товаров'>
        <select
          className={selectCls}
          value={source}
          onChange={e => set('source', e.target.value)}
        >
          <option value='promotion'>Акции (со скидкой)</option>
          <option value='novelty'>Новинки</option>
          <option value='popular'>Популярные</option>
          <option value='category'>Из категории</option>
          <option value='property'>По характеристике</option>
        </select>
      </Field>

      {source === 'category' && (
        <Field label='Категория' hint='Показывать товары из этой категории'>
          <select
            className={selectCls}
            value={(value.categoryId as string | undefined) ?? ''}
            onChange={e => set('categoryId', e.target.value || undefined)}
          >
            <option value=''>Выберите категорию…</option>
            {categories?.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {source === 'property' && (
        <>
          <Field label='Характеристика'>
            <select
              className={selectCls}
              value={selectedPropId}
              onChange={e => {
                onChange({
                  ...value,
                  _propertyId: e.target.value,
                  propertyValueId: '',
                })
              }}
            >
              <option value=''>Выберите характеристику…</option>
              {properties?.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          {selectedProp && (
            <Field label='Значение' hint={`Товары, у которых ${selectedProp.name} = выбранное значение`}>
              <select
                className={selectCls}
                value={(value.propertyValueId as string | undefined) ?? ''}
                onChange={e => set('propertyValueId', e.target.value || undefined)}
              >
                <option value=''>Выберите значение…</option>
                {selectedProp.values.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.value}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </>
      )}

      <div className='grid grid-cols-2 gap-3'>
        <Field label='Сортировка'>
          <select
            className={selectCls}
            value={(value.sortBy as string | undefined) ?? 'newest'}
            onChange={e => set('sortBy', e.target.value)}
          >
            <option value='newest'>Новые сначала</option>
            <option value='popular'>По популярности</option>
            <option value='price_asc'>Цена ↑</option>
            <option value='price_desc'>Цена ↓</option>
          </select>
        </Field>

        <Field label='Количество товаров (1–24)'>
          <input
            type='number'
            min={1}
            max={24}
            className={inputCls}
            value={(value.limit as number | undefined) ?? 8}
            onChange={e => set('limit', Number(e.target.value))}
          />
        </Field>

        <Field label='Количество колонок'>
          <select
            className={selectCls}
            value={String((value.cols as number | undefined) ?? 4)}
            onChange={e => set('cols', Number(e.target.value))}
          >
            <option value='2'>2 колонки</option>
            <option value='3'>3 колонки</option>
            <option value='4'>4 колонки (по умолчанию)</option>
            <option value='6'>6 колонок (мини-карточки)</option>
          </select>
        </Field>
      </div>

      <div className='grid grid-cols-2 gap-3 border-t border-border pt-3'>
        <Field label='Ссылка «Смотреть все»' hint='Оставьте пустым, чтобы скрыть'>
          <input
            className={inputCls}
            value={(value.viewAllHref as string | undefined) ?? ''}
            onChange={e => set('viewAllHref', e.target.value || undefined)}
            placeholder='/catalog'
          />
        </Field>
        <Field label='Текст ссылки'>
          <input
            className={inputCls}
            value={(value.viewAllLabel as string | undefined) ?? ''}
            onChange={e => set('viewAllLabel', e.target.value || undefined)}
            placeholder='Смотреть все'
          />
        </Field>
      </div>
    </div>
  )
}

// ─── BrandCarouselConfig ──────────────────────────────────────────────────────

function BrandCarouselConfigEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const { data: properties } = trpc.properties.getAll.useQuery()

  function set(key: string, val: unknown) {
    onChange({ ...value, [key]: val })
  }

  const propSlug = (value.propertySlug as string | undefined) ?? 'brand'

  return (
    <div className='space-y-3'>
      <Field
        label='Характеристика (группа значений)'
        hint='Например: brand, location, color. Каждое значение — один элемент карусели.'
      >
        <select
          className={selectCls}
          value={propSlug}
          onChange={e => {
            set('propertySlug', e.target.value)
            set('filterParam', e.target.value)
          }}
        >
          {properties?.map(p => (
            <option key={p.slug} value={p.slug}>
              {p.name} ({p.slug})
            </option>
          ))}
          {!properties?.length && (
            <option value='brand'>brand (загрузка…)</option>
          )}
        </select>
      </Field>

      <Field
        label='Параметр фильтра в URL'
        hint='В каталоге ссылка будет: /catalog?{параметр}=значение'
      >
        <input
          className={inputCls}
          value={(value.filterParam as string | undefined) ?? propSlug}
          onChange={e => set('filterParam', e.target.value)}
          placeholder={propSlug}
        />
      </Field>

      <div className='grid grid-cols-2 gap-3 border-t border-border pt-3'>
        <Field label='Ссылка «Смотреть все»'>
          <input
            className={inputCls}
            value={(value.viewAllHref as string | undefined) ?? ''}
            onChange={e => set('viewAllHref', e.target.value || undefined)}
            placeholder='/catalog'
          />
        </Field>
        <Field label='Текст ссылки'>
          <input
            className={inputCls}
            value={(value.viewAllLabel as string | undefined) ?? ''}
            onChange={e => set('viewAllLabel', e.target.value || undefined)}
            placeholder='Все бренды'
          />
        </Field>
      </div>
    </div>
  )
}

// ─── CategoryCarouselConfig ───────────────────────────────────────────────────

function CategoryCarouselConfigEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const { data: categories } = trpc.categories.getAll.useQuery()
  const rootCategories = categories?.filter(c => !c.parentId) ?? []

  function set(key: string, val: unknown) {
    onChange({ ...value, [key]: val })
  }

  return (
    <div className='space-y-3'>
      <Field
        label='Родительская категория'
        hint='Показать подкатегории выбранной. Оставьте «Корень» для отображения корневых категорий.'
      >
        <select
          className={selectCls}
          value={(value.parentId as string | undefined) ?? ''}
          onChange={e => set('parentId', e.target.value || undefined)}
        >
          <option value=''>Корень (главные категории)</option>
          {rootCategories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </Field>

      <div className='grid grid-cols-2 gap-3'>
        <Field label='Максимум категорий (1–48)'>
          <input
            type='number'
            min={1}
            max={48}
            className={inputCls}
            value={(value.limit as number | undefined) ?? 12}
            onChange={e => set('limit', Number(e.target.value))}
          />
        </Field>
        <Field label='Сортировка'>
          <select
            className={selectCls}
            value={(value.orderBy as string | undefined) ?? 'name'}
            onChange={e => set('orderBy', e.target.value)}
          >
            <option value='name'>По названию A→Z</option>
            <option value='createdAt'>По дате добавления</option>
          </select>
        </Field>
      </div>
    </div>
  )
}

// ─── AdvantagesConfig ─────────────────────────────────────────────────────────

interface AdvItem {
  icon: string
  title: string
  subtitle?: string
}

function AdvantagesConfigEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const items: AdvItem[] = Array.isArray(value.items)
    ? (value.items as AdvItem[])
    : []

  function setItems(next: AdvItem[]) {
    onChange({ ...value, items: next })
  }

  function update(idx: number, patch: Partial<AdvItem>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  }

  function add() {
    setItems([...items, { icon: '/question.svg', title: '' }])
  }

  function remove(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...items]
    const t = idx + dir
    if (t < 0 || t >= next.length) return
    ;[next[idx], next[t]] = [next[t], next[idx]]
    setItems(next)
  }

  const ICON_PRESETS = [
    { label: 'Машина / доставка', value: '/car.svg' },
    { label: 'Магазин', value: '/store.svg' },
    { label: 'Инструмент / монтаж', value: '/spanner.svg' },
    { label: 'Коробка / склад', value: '/box.svg' },
    { label: 'Вопрос / консультация', value: '/question.svg' },
    { label: 'Скидка / акция', value: '/sale.svg' },
  ]

  return (
    <div className='space-y-3'>
      <Field label='Заголовок секции'>
        <input
          className={inputCls}
          value={(value.heading as string | undefined) ?? ''}
          onChange={e => onChange({ ...value, heading: e.target.value })}
          placeholder='Наши преимущества'
        />
      </Field>

      <div className='flex items-center justify-between'>
        <p className='text-xs font-medium text-muted-foreground'>
          Преимущества ({items.length === 0 ? 'используются дефолтные' : items.length})
        </p>
        <Button type='button' variant='secondary' size='sm' onClick={add}>
          <Plus className='mr-1 h-3.5 w-3.5' /> Добавить
        </Button>
      </div>

      {items.length === 0 && (
        <p className='rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground'>
          Не задано — отображаются 6 стандартных преимуществ. Нажмите «Добавить» чтобы создать свой список.
        </p>
      )}

      <div className='space-y-2'>
        {items.map((item, idx) => (
          <div
            key={idx}
            className='rounded-xl border border-border bg-muted/10 p-3 space-y-2'
          >
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-foreground'>
                Пункт {idx + 1}
              </span>
              <div className='flex items-center gap-1'>
                <button
                  type='button'
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
                >
                  <ChevronUp className='h-3 w-3' />
                </button>
                <button
                  type='button'
                  onClick={() => move(idx, 1)}
                  disabled={idx === items.length - 1}
                  className='rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30'
                >
                  <ChevronDown className='h-3 w-3' />
                </button>
                <button
                  type='button'
                  onClick={() => remove(idx)}
                  className='rounded p-0.5 text-destructive/70 hover:text-destructive'
                >
                  <Trash2 className='h-3 w-3' />
                </button>
              </div>
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <Field label='Иконка'>
                <select
                  className={selectCls}
                  value={item.icon}
                  onChange={e => update(idx, { icon: e.target.value })}
                >
                  {ICON_PRESETS.map(p => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label='Название'>
                <input
                  className={inputCls}
                  value={item.title}
                  onChange={e => update(idx, { title: e.target.value })}
                  placeholder='Бесплатная'
                />
              </Field>
              <Field label='Подпись'>
                <input
                  className={inputCls}
                  value={item.subtitle ?? ''}
                  onChange={e =>
                    update(idx, { subtitle: e.target.value || undefined })
                  }
                  placeholder='доставка'
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── AboutTextConfig ──────────────────────────────────────────────────────────

function AboutTextConfigEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const paragraphs: string[] = Array.isArray(value.paragraphs)
    ? (value.paragraphs as string[])
    : []

  function setParagraphs(next: string[]) {
    onChange({ ...value, paragraphs: next })
  }

  return (
    <div className='space-y-3'>
      <Field label='Заголовок'>
        <input
          className={inputCls}
          value={(value.heading as string | undefined) ?? ''}
          onChange={e => onChange({ ...value, heading: e.target.value })}
          placeholder='Интернет магазин освещения Аура Света'
        />
      </Field>

      <div className='flex items-center justify-between'>
        <p className='text-xs font-medium text-muted-foreground'>
          Абзацы ({paragraphs.length === 0 ? 'используются дефолтные' : paragraphs.length})
        </p>
        <Button
          type='button'
          variant='secondary'
          size='sm'
          onClick={() => setParagraphs([...paragraphs, ''])}
        >
          <Plus className='mr-1 h-3.5 w-3.5' /> Абзац
        </Button>
      </div>

      {paragraphs.length === 0 && (
        <p className='rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground'>
          Не задано — отображается стандартный текст. Нажмите «Абзац» чтобы написать свой.
        </p>
      )}

      <div className='space-y-2'>
        {paragraphs.map((p, idx) => (
          <div key={idx} className='flex gap-2'>
            <textarea
              rows={3}
              className={textareaCls + ' flex-1'}
              value={p}
              onChange={e => {
                const next = [...paragraphs]
                next[idx] = e.target.value
                setParagraphs(next)
              }}
              placeholder={`Абзац ${idx + 1}…`}
            />
            <button
              type='button'
              onClick={() =>
                setParagraphs(paragraphs.filter((_, i) => i !== idx))
              }
              className='self-start rounded p-1 text-destructive/60 hover:text-destructive'
            >
              <Trash2 className='h-3.5 w-3.5' />
            </button>
          </div>
        ))}
      </div>

      <Field label='Кнопка «Развернуть/свернуть»'>
        <label className='flex items-center gap-2 text-sm text-foreground'>
          <input
            type='checkbox'
            checked={
              value.expandable === undefined ? true : Boolean(value.expandable)
            }
            onChange={e => onChange({ ...value, expandable: e.target.checked })}
            className='h-4 w-4 rounded accent-primary'
          />
          Показывать кнопку (по умолчанию — да)
        </label>
      </Field>
    </div>
  )
}

// ─── PopularQueriesConfig ─────────────────────────────────────────────────────

function PopularQueriesConfigEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  return (
    <div className='space-y-3'>
      <Field label='Заголовок секции'>
        <input
          className={inputCls}
          value={(value.heading as string | undefined) ?? ''}
          onChange={e => onChange({ ...value, heading: e.target.value })}
          placeholder='Популярные запросы'
        />
      </Field>
      <Field
        label='Количество запросов (1–30)'
        hint='Берутся самые популярные поисковые запросы за последние 7 дней.'
      >
        <input
          type='number'
          min={1}
          max={30}
          className={inputCls}
          value={(value.limit as number | undefined) ?? 10}
          onChange={e => onChange({ ...value, limit: Number(e.target.value) })}
        />
      </Field>
    </div>
  )
}

// ─── Fallback — raw JSON ──────────────────────────────────────────────────────

function RawJsonEditor({
  value,
  onChange,
}: {
  value: Record<string, unknown>
  onChange: (v: Record<string, unknown>) => void
}) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2))
  const [err, setErr] = useState<string | null>(null)

  function handleChange(next: string) {
    setText(next)
    try {
      onChange(JSON.parse(next))
      setErr(null)
    } catch {
      setErr('Некорректный JSON')
    }
  }

  return (
    <div>
      <textarea
        rows={10}
        className={textareaCls + ' font-mono text-xs'}
        value={text}
        onChange={e => handleChange(e.target.value)}
      />
      {err && <p className='mt-1 text-[10px] text-destructive'>{err}</p>}
    </div>
  )
}

// ─── Public component ─────────────────────────────────────────────────────────

interface SectionConfigEditorProps {
  componentName: string
  value: Record<string, unknown>
  onChange: (config: Record<string, unknown>) => void
  apiBaseUrl: string
}

export function SectionConfigEditor({
  componentName,
  value,
  onChange,
  apiBaseUrl,
}: SectionConfigEditorProps) {
  const [showRaw, setShowRaw] = useState(false)

  const hasVisualEditor = [
    'Banner',
    'HeroBanner',
    'ProductGrid',
    'BrandCarousel',
    'CategoryCarousel',
    'Advantages',
    'AboutText',
    'AboutSection',
    'PopularQueries',
  ].includes(componentName)

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <label className='block text-xs font-medium text-muted-foreground'>
          Настройки секции
        </label>
        {hasVisualEditor && (
          <button
            type='button'
            onClick={() => setShowRaw(v => !v)}
            className='flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
          >
            <Code2 className='h-3 w-3' />
            {showRaw ? 'Визуальный редактор' : 'Показать JSON'}
          </button>
        )}
      </div>

      {showRaw || !hasVisualEditor ? (
        <RawJsonEditor value={value} onChange={onChange} />
      ) : (
        <>
          {(componentName === 'Banner' || componentName === 'HeroBanner') && (
            <BannerConfigEditor
              value={value}
              onChange={onChange}
              apiBaseUrl={apiBaseUrl}
            />
          )}
          {componentName === 'ProductGrid' && (
            <ProductGridConfigEditor value={value} onChange={onChange} />
          )}
          {componentName === 'BrandCarousel' && (
            <BrandCarouselConfigEditor value={value} onChange={onChange} />
          )}
          {componentName === 'CategoryCarousel' && (
            <CategoryCarouselConfigEditor value={value} onChange={onChange} />
          )}
          {(componentName === 'Advantages') && (
            <AdvantagesConfigEditor value={value} onChange={onChange} />
          )}
          {(componentName === 'AboutText' || componentName === 'AboutSection') && (
            <AboutTextConfigEditor value={value} onChange={onChange} />
          )}
          {componentName === 'PopularQueries' && (
            <PopularQueriesConfigEditor value={value} onChange={onChange} />
          )}
        </>
      )}
    </div>
  )
}
