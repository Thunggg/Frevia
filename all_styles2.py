from lxml import etree
import zipfile
z = zipfile.ZipFile(r'sample\Report4_Software Design Document.docx')
doc = z.read('word/document.xml')
root = etree.fromstring(doc)
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
body = root.find('.//w:body', ns)
ps = body.findall('.//w:p', ns)
out = []
for p in ps:
    pPr = p.find('.//w:pPr', ns)
    style = None
    if pPr is not None:
        pStyle = pPr.find('.//w:pStyle', ns)
        if pStyle is not None:
            style = pStyle.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
    texts = p.findall('.//w:t', ns)
    t = ''.join(x.text or '' for x in texts)
    if t.strip():
        out.append((style if style else 'Normal', t.strip()))
        if len(out)>400: break
for o in out:
    print(o[0]+': '+o[1])
