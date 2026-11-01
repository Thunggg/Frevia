from lxml import etree
import zipfile
z = zipfile.ZipFile(r'sample\Report4_Software Design Document.docx')
doc = z.read('word/document.xml')
root = etree.fromstring(doc)
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
body = root.find('.//w:body', ns)
ps = body.findall('.//w:p', ns)
count=0
for p in ps:
    pPr = p.find('.//w:pPr', ns)
    if pPr is None: continue
    pStyle = pPr.find('.//w:pStyle', ns)
    if pStyle is None: continue
    style = pStyle.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val')
    if style in ['Heading1','Heading2','Heading3','Heading4','HeadingLv1','HeadingLv2']:
        texts = p.findall('.//w:t', ns)
        t = ''.join(x.text or '' for x in texts)
        numPr = pPr.find('.//w:numPr', ns)
        if numPr is not None:
            numId = numPr.find('.//w:numId', ns)
            ilvl = numPr.find('.//w:ilvl', ns)
            print('NUM', style, numId.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if numId else None, ilvl.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if ilvl else None, ':', t.strip()[:60])
        else:
            print('NONUM', style, ':', t.strip()[:60])
        count+=1
        if count>60: break
