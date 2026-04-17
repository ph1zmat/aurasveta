import { useState, useEffect } from 'react'
import { View, Text, ScrollView, Switch, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { trpc } from '../lib/trpc'
import { colors, fontSize, fontWeight, spacing } from '../theme'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ImagePicker } from '../components/ui/ImagePicker'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { MoreStackParamList } from '../navigation/types'

function generateSlug(text: string) {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
    н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'shch',
    ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  }
  return text.toLowerCase().split('').map(c => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

type Props = NativeStackScreenProps<MoreStackParamList, 'PageForm'>

export function PageFormScreen({ navigation, route }: Props) {
  const editId = route.params?.id
  const isEdit = !!editId

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [isPublished, setIsPublished] = useState(false)
  const [saving, setSaving] = useState(false)

  const utils = trpc.useUtils()
  const { data: existing } = trpc.pages.getById.useQuery(editId!, { enabled: !!editId })

  const createMut = trpc.pages.create.useMutation({
    onSuccess: () => { utils.pages.getAll.invalidate(); navigation.goBack() },
  })
  const updateMut = trpc.pages.update.useMutation({
    onSuccess: () => { utils.pages.getAll.invalidate(); navigation.goBack() },
  })
  const updateImageMut = trpc.pages.updateImagePath.useMutation({
    onSuccess: () => { if (editId) utils.pages.getById.invalidate(editId) },
  })
  const removeImageMut = trpc.pages.removeImage.useMutation({
    onSuccess: () => { if (editId) utils.pages.getById.invalidate(editId) },
  })

  useEffect(() => {
    if (existing) {
      setTitle(existing.title || '')
      setSlug(existing.slug || '')
      setContent(existing.content || '')
      setMetaTitle((existing as any).metaTitle || '')
      setMetaDesc((existing as any).metaDesc || '')
      setIsPublished(existing.isPublished ?? false)
    }
  }, [existing])

  const handleTitleChange = (text: string) => {
    setTitle(text)
    if (!isEdit) setSlug(generateSlug(text))
  }

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert('Ошибка', 'Введите заголовок'); return }
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        metaTitle: metaTitle.trim() || null,
        metaDesc: metaDesc.trim() || null,
        isPublished,
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
        {/* Cover image */}
        {isEdit && (
          <View style={styles.field}>
            <Text style={styles.label}>Обложка</Text>
            <ImagePicker
              imageUrl={(existing as any)?.image ?? null}
              onImageUploaded={(path) => updateImageMut.mutate({ id: editId!, path })}
              onImageRemoved={() => removeImageMut.mutate(editId!)}
              height={140}
            />
          </View>
        )}

        <Input label="Заголовок *" value={title} onChangeText={handleTitleChange} containerStyle={styles.field} />
        <Input label="Slug" value={slug} onChangeText={setSlug} autoCapitalize="none" containerStyle={styles.field} />
        <Input
          label="Содержимое"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          style={{ height: 200, textAlignVertical: 'top' }}
          containerStyle={styles.field}
        />

        {/* SEO section */}
        <Text style={styles.sectionTitle}>SEO</Text>
        <Input label="Meta Title" value={metaTitle} onChangeText={setMetaTitle} containerStyle={styles.field} />
        <Input
          label="Meta Description"
          value={metaDesc}
          onChangeText={setMetaDesc}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
          containerStyle={styles.field}
        />

        {/* Published toggle */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>Опубликовано</Text>
          <Switch value={isPublished} onValueChange={setIsPublished} trackColor={{ true: colors.primary }} thumbColor={colors.white} />
        </View>

        <Button title={isEdit ? 'Сохранить' : 'Создать страницу'} onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  field: { marginBottom: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.mutedForeground, marginBottom: spacing.xs },
  sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, color: colors.foreground, marginTop: spacing.lg, marginBottom: spacing.md },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm, marginBottom: spacing.md },
})
