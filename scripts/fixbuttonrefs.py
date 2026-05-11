import re

files = [
    ('app/admin/home-sections/HomeSectionsClient.tsx', True),
    ('app/admin/properties/PropertiesClient.tsx', True),
    ('app/admin/settings/SettingsClient.tsx', True),
    ('app/admin/import-export/ImportExportClient.tsx', False),
]

for filepath, fix_button in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if fix_button:
        # Replace remaining <Button...> with <NLButton...>
        content = content.replace('<Button ', '<NLButton ')
        content = content.replace('</Button>', '</NLButton>')
        # Remove unused NLButton import if no longer needed
        if '<NLButton' not in content:
            content = re.sub(
                r"import \{ NLButton \} from '\.\./components/ui/button'\n",
                '',
                content,
            )
    else:
        # Remove unused ArrowDownToLine import
        content = content.replace(
            "import {\n\tDownload,\n\tUpload,\n\tFileJson,\n\tFileSpreadsheet,\n\tCheckCircle2,\n\tAlertCircle,\n\tArrowDownToLine,\n\tArrowUpFromLine,\n\tPackage,\n} from 'lucide-react'",
            "import {\n\tDownload,\n\tUpload,\n\tFileJson,\n\tFileSpreadsheet,\n\tCheckCircle2,\n\tAlertCircle,\n\tArrowUpFromLine,\n\tPackage,\n} from 'lucide-react'",
        )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'Fixed: {filepath}')
