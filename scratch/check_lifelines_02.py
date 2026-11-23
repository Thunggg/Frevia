import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.02-update-contract.drawio')
root = tree.getroot()
print('=== Lifelines in UC-13.02 ===')
for c in root.findall('.//mxCell'):
    style = c.get('style', '')
    if 'shape=umlLifeline' in style or 'actor' in c.get('id', '') or 'db' in c.get('id', ''):
        print(f"id={c.get('id')}, value={c.get('value')}, x={c.find('mxGeometry').get('x')}")
