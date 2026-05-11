with open('app/admin/settings/SettingsClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("variant='primary'", "variant='default'")
with open('app/admin/settings/SettingsClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed')
