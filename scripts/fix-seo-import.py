with open('app/admin/seo/SeoClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace(
    "import { NLButton } from '../components/ui/button'\nimport { NLInput } from '../components/ui/input'",
    "import { NLButton } from '../components/ui/button'"
)
with open('app/admin/seo/SeoClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed')
