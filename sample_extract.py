from lxml import etree
import zipfile

z = zipfile.ZipFile(r'sample\Report4_Software Design Document.docx')
doc = z.read('word/document.xml')
root = etree.fromstring(doc)
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
body = root.find('.//w:body', ns)
ps = body.findall('.//w:p', ns)
count = 0
lines = []
for p in ps:
    texts = p.findall('.//w:t', ns)
    t = ''.join(x.text or '' for x in texts)
    s = t.strip()
    if s == '':
        continue
    lines.append(s)
    count += 1
    if count >= 200:
        break

with open(r'sample_outline.txt', 'w', encoding='utf-8') as f:
    for i, l in enumerate(lines):
        f.write(f'{i+1}: {l}\n')

print('done')
