import re

with open('app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused imports
content = content.replace("import Link from 'next/link'\n", '')
content = content.replace("import Image from 'next/image'\n", '')
content = content.replace("import { resolveStorageFileUrl } from '@/shared/lib/storagefileurl'\n", '')

# Replace h1 with conditional
old_h1 = """\t\t\t\t{/* SEO: H1 заголовок главной страницы */}
\t\t\t\t<h1 className='py-6 text-xl font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
\t\t\t\t\tСветотехника и осветительные приборы в Мозыре — Аура Света
\t\t\t\t</h1>"""
new_h1 = """\t\t\t\t{/* SEO: H1 заголовок главной страницы */}
\t\t\t\t{homeH1 ? (
\t\t\t\t\t<h1 className='py-6 text-xl font-semibold uppercase tracking-widest text-foreground md:text-2xl'>
\t\t\t\t\t\t{homeH1}
\t\t\t\t\t</h1>
\t\t\t\t) : null}"""
content = content.replace(old_h1, new_h1)

# Remove unused popularCategories and featuredProducts blocks
pattern = r"\t// SEO: дополнительные внутренние ссылки на популярные категории и товары\n\tlet popularCategories: Array<\{[^}]+\}> = \[\]\n\tlet featuredProducts: Array<\{[^}]+\}> = \[\]\n\n\ttry \{\n\t\tpopularCategories = await prisma\.category\.findMany\(\{[^}]+\}\)\n\t\} catch \{\n\t\t/\* игнорируем — это дополнительный SEO-блок \*/\n\t\}\n\n\ttry \{\n\t\tfeaturedProducts = await prisma\.product\.findMany\(\{[^}]+\}\)\n\t\} catch \{\n\t\t/\* игнорируем — это дополнительный SEO-блок \*/\n\t\}\n\n"
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')
