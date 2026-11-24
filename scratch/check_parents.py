import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.02-update-contract.drawio')
for c in tree.getroot().findall('.//mxCell'):
    if 'bar_' in c.get('id', ''):
        print(f'{c.get("id")}: parent={c.get("parent")} | geo={c.find("mxGeometry").attrib}')
