from lxml import etree
import zipfile
z = zipfile.ZipFile(r'sample\Report4_Software Design Document.docx')
styles = z.read('word/styles.xml')
root = etree.fromstring(styles)
ns = {'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
res=[]
for s in root.findall('.//w:style', ns):
    sid = s.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}styleId')
    name = s.find('.//w:name', ns)
    if name is not None and 'Heading' in str(name.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val','')):
        res.append(sid+':'+name.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'))
for x in res:
    print(x)
