import xml.etree.ElementTree as ET

root = ET.parse('class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio').getroot()
parent = None
for c in root.findall('.//mxCell'):
    if c.get('id') == 'contract_ctrl':
        parent = c
        break

geo = parent.find('mxGeometry')
print('Parent:', parent.attrib, geo.attrib)
children = [c for c in root.findall('.//mxCell') if c.get('parent') == 'contract_ctrl']
for ch in children[:3]:
    cgeo = ch.find('mxGeometry')
    print('  Child:', ch.attrib['id'], ch.attrib.get('value', ''), cgeo.attrib if cgeo is not None else 'None')
