import re

# CategoriesClient.tsx
with open('app/admin/categories/CategoriesClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Button import
content = content.replace("import { Button } from '@/shared/ui/Button'\n", '')

# Add NLButton import
if 'NLButton' not in content:
    content = content.replace(
        "import { useAdminSearchParams } from '../hooks/useAdminSearchParams'",
        "import { useAdminSearchParams } from '../hooks/useAdminSearchParams'\nimport { NLButton } from '../components/ui/button'",
    )

# Replace <Button ...> with <NLButton ...>
content = content.replace('<Button ', '<NLButton ')
content = content.replace('</Button>', '</NLButton>')

# Replace primary variant
content = content.replace("variant='primary'", "variant='default'")

# Remove header block
content = re.sub(
    r"\s+\{/\* Header \*/\}\s+<div className='flex items-center justify-between'>\s*"
    r"<div className='flex items-center gap-3'>\s*"
    r"<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>\s*"
    r"<FolderTree className='h-5 w-5 text-primary' />\s*"
    r"</div>\s*"
    r"<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>\s*"
    r"Категории\s*"
    r"</h1>\s*"
    r"</div>\s*"
    r"<NLButton\s+size='sm'\s+onClick=\{openCreate\}>\s*"
    r"<Plus className='h-4 w-4' /> Добавить\s*"
    r"</NLButton>\s*"
    r"</div>",
    "<div className='flex items-center justify-end'><NLButton size='sm' onClick={openCreate}><Plus className='h-4 w-4' /> Добавить</NLButton></div>",
    content,
    flags=re.DOTALL,
)

# Replace colors
content = content.replace('bg-primary/10', 'bg-muted')
content = content.replace('text-primary', 'text-[var(--nl-accent)]')
content = content.replace('text-emerald-500', 'text-[var(--nl-success)]')
content = content.replace('bg-emerald-500/10', 'bg-[var(--nl-success)]/10')

with open('app/admin/categories/CategoriesClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('CategoriesClient done')

# SeoClient.tsx
with open('app/admin/seo/SeoClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove Button import
content = content.replace("import { Button } from '@/shared/ui/Button'\n", '')

# Add NLButton and NLInput imports
if 'NLButton' not in content:
    content = content.replace(
        "import { useAdminSearchParams } from '../hooks/useAdminSearchParams'",
        "import { useAdminSearchParams } from '../hooks/useAdminSearchParams'\nimport { NLButton } from '../components/ui/button'\nimport { NLInput } from '../components/ui/input'",
    )

# Replace <Button ...> with <NLButton ...>
content = content.replace('<Button ', '<NLButton ')
content = content.replace('</Button>', '</NLButton>')

# Replace primary variant
content = content.replace("variant='primary'", "variant='default'")

# Remove header block with h1 SEO
content = re.sub(
    r"\s+\{/\* Header \*/\}\s+<div className='flex items-center justify-between'>\s*"
    r"<div className='flex items-center gap-3'>\s*"
    r"<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>\s*"
    r"<Search className='h-5 w-5 text-primary' />\s*"
    r"</div>\s*"
    r"<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>\s*"
    r"SEO\s*"
    r"</h1>\s*"
    r"</div>\s*"
    r"</div>",
    '',
    content,
    flags=re.DOTALL,
)

# Replace search input with NLInput
content = re.sub(
    r"<input\s+value=\{search\}\s+onChange=\{e =>\s+updateSearchParams\(\s*\{\s*search: e\.target\.value,\s*targetType: null,\s*targetId: null,\s*targetName: null,\s*\},\s*\{ history: 'replace' \},\s*\)\}\s+placeholder='Поиск\.\.\.'\s+className='flex h-9 w-full rounded-lg border border-border bg-background px-3 py-2 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary'\s*/>",
    "<NLInput\n\t\t\t\t\t\tvalue={search}\n\t\t\t\t\t\tonChange={e =>\n\t\t\t\t\t\t\tupdateSearchParams(\n\t\t\t\t\t\t\t\t{\n\t\t\t\t\t\t\t\t\tsearch: e.target.value,\n\t\t\t\t\t\t\t\t\ttargetType: null,\n\t\t\t\t\t\t\t\t\ttargetId: null,\n\t\t\t\t\t\t\t\t\ttargetName: null,\n\t\t\t\t\t\t\t\t},\n\t\t\t\t\t\t\t\t{ history: 'replace' },\n\t\t\t\t\t\t\t)\n\t\t\t\t\t\t}\n\t\t\t\t\t\tplaceholder='Поиск...'\n\t\t\t\t\t\tclassName='pl-9'\n\t\t\t\t\t/>",
    content,
    flags=re.DOTALL,
)

# Replace colors
content = content.replace('bg-primary/10', 'bg-muted')
content = content.replace('text-primary', 'text-[var(--nl-accent)]')

with open('app/admin/seo/SeoClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('SeoClient done')
