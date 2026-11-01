with open(r'docs\Report 4\sections\2.Database_Design.tex', encoding='utf-8') as f:
    content = f.read()

lines = content.splitlines()
for i, l in enumerate(lines[150:250], 150+1):
    print(f'{i}: {l}')
