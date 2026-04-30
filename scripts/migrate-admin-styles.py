import re

files_to_process = [
    'app/admin/import-export/ImportExportClient.tsx',
    'app/admin/settings/SettingsClient.tsx',
    'app/admin/properties/PropertiesClient.tsx',
    'app/admin/pages/PagesClient.tsx',
    'app/admin/home-sections/HomeSectionsClient.tsx',
]

for filepath in files_to_process:
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f'SKIP: {filepath} not found')
        continue

    original = content

    # 1. Remove common header pattern with h1
    content = re.sub(
        r"\s+\{/\* Header \*/\}\s+<div className='flex items-center (gap-3|justify-between)'>\s*"
        r"(<div className='flex items-center gap-3'>\s*)?"
        r"<div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10'>\s*"
        r"<[^>]+className='h-5 w-5 text-primary' />\s*"
        r"</div>\s*"
        r"<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>\s*"
        r"[^<]+</h1>\s*"
        r"(</div>\s*)?"
        r"</div>",
        '',
        content,
        flags=re.DOTALL,
    )

    # 2. Remove simpler h1-only header inside flex justify-between
    content = re.sub(
        r"<div className='flex items-center justify-between'>\s*"
        r"<h1 className='text-xl font-semibold uppercase tracking-widest text-foreground'>\s*"
        r"[^<]+</h1>",
        "<div className='flex items-center justify-end'>",
        content,
        flags=re.DOTALL,
    )

    # 3. Replace Button import from @/shared/ui/Button with NLButton
    content = re.sub(
        r"import \{ Button \} from '@/shared/ui/Button'\n",
        "",
        content,
    )
    if 'NLButton' not in content and ("<Button" in content or "<NLButton" in content):
        # Add NLButton import near lucide-react import
        content = re.sub(
            r"(import \{[^}]+\} from 'lucide-react'\n)",
            r"\1import { NLButton } from '../components/ui/button'\n",
            content,
        )

    # 4. Replace <Button variant='primary'... with <NLButton...
    content = re.sub(
        r"<Button\s+variant='primary'\s+size='sm'\s+onClick=\{([^}]+)\}\s*>",
        r"<NLButton size='sm' onClick={\1}>",
        content,
    )

    # 5. Replace mr-1 in icon with simple icon inside NLButton
    content = content.replace("<Plus className='mr-1 h-4 w-4' />", "<Plus className='h-4 w-4' />")
    content = content.replace("<Pencil className='mr-1 h-4 w-4' />", "<Pencil className='h-4 w-4' />")

    # 6. Replace inline primary buttons with NLButton
    content = re.sub(
        r"<button\s+onClick=\{([^}]+)\}\s+className='flex items-center gap-1\.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90'\s*>\s*"
        r"(<Plus className='h-4 w-4' />\s*)?"
        r"([^<]+)</button>",
        r"<NLButton size='sm' onClick={\1}>\2\3</NLButton>",
        content,
        flags=re.DOTALL,
    )

    # 7. Replace emerald colors with nl-success
    content = content.replace("text-emerald-500", "text-[var(--nl-success)]")
    content = content.replace("bg-emerald-500/10", "bg-[var(--nl-success)]/10")
    content = content.replace("bg-emerald-500/20", "bg-[var(--nl-success)]/20")

    # 8. Replace amber colors with nl-accent
    content = content.replace("text-amber-500", "text-[var(--nl-accent)]")
    content = content.replace("bg-amber-500/10", "bg-[var(--nl-accent)]/10")
    content = content.replace("bg-amber-500/20", "bg-[var(--nl-accent)]/20")

    # 9. Replace primary/10 icon backgrounds with muted
    content = content.replace("bg-primary/10", "bg-muted")
    content = content.replace("text-primary", "text-[var(--nl-accent)]")

    # 10. Replace old empty states with dashed style
    content = re.sub(
        r"<div className='rounded-2xl border border-border bg-muted/20 p-12 text-center text-sm text-muted-foreground'>\s*([^<]+)</div>",
        r"<div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/10 py-12'>\n\t\t\t\t\t<p className='text-sm text-muted-foreground'>\1</p>\n\t\t\t\t</div>",
        content,
    )

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'UPDATED: {filepath}')
    else:
        print(f'NO CHANGES: {filepath}')
