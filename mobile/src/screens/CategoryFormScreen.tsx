import { useState, useEffect } from 'react'
import { ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, spacing } from '../theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ImagePicker } from '../components/ui/ImagePicker'
import type { CategoryFormProps } from '../navigation/types'

function generateSlug(text: string) {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
    н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'shch',
    ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  }
  return text.toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function CategoryFormScreen({ navigation, route }: CategoryFormProps) {
  const editId = route.params?.id
  const parentId = route.params?.parentId
  const isEdit = !!editId

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const utils = trpc.useUtils()
  const { data: existing } = trpc.categories.getAll.useQuery()
  const cat = isEdit ? (existing ?? []).find((c: any) => c.id === editId) as any : null

  const createMut = trpc.categories.create.useMutation({
    onSuccess: () => { utils.categories.getTree.invalidate(); utils.categories.getAll.invalidate(); navigation.goBack() },
  })
  const updateMut = trpc.categories.update.useMutation({
    onSuccess: () => { utils.categories.getTree.invalidate(); utils.categories.getAll.invalidate(); navigation.goBack() },
  })
  const updateImageMut = trpc.categories.updateImagePath.useMutation({
    onSuccess: () => utils.categories.getAll.invalidate(),
  })
  const removeImageMut = trpc.categories.removeImage.useMutation({
    onSuccess: () => utils.categories.getAll.invalidate(),
  })

  useEffect(() => {
    if (cat) {
      setName(cat.name || '')
      setSlug(cat.slug || '')
      setDescription(cat.description || '')
    }
  }, [cat])

  const handleNameChange = (text: string) => {
    setName(text)
    if (!isEdit) setSlug(generateSlug(text))
  }

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Ошибка', 'Введите название категории'); return }

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        parentId: parentId || null,
      }

      if (isEdit) {
        await updateMut.mutateAsync({ id: editId!, ...payload })
      } else {
        await createMut.mutateAsync(payload as any)
      }
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isEdit && (
          <ImagePicker
            imageUrl={cat?.image ?? null}
            onImageUploaded={(path) => updateImageMut.mutate({ id: editId!, path })}
            onImageRemoved={() => removeImageMut.mutate(editId!)}
            height={160}
          />
        )}

        <Input label="Название *" value={name} onChangeText={handleNameChange} containerStyle={styles.field} />
        <Input label="Slug" value={slug} onChangeText={setSlug} containerStyle={styles.field} />
        <Input
          label="Описание"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
          containerStyle={styles.field}
        />

        <Button title={isEdit ? 'Сохранить' : 'Создать категорию'} onPress={handleSave} loading={saving} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  field: { marginTop: spacing.md },
})
