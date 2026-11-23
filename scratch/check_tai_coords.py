import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams/ptai/UC-11.04_-_Update_Job.drawio')
root = tree.getroot()
print("=== Lifelines in Tai UC-11.04 ===")
for c in root.findall('.//mxCell'):
    style = c.get('style', '')
    if 'shape=umlLifeline' in style or 'actor' in c.get('id', '') or 'node_db' in c.get('id', ''):
        geo = c.find('mxGeometry')
        print(f"{c.get('id')}: val='{c.get('value')}', x={geo.get('x')}, y={geo.get('y')}, w={geo.get('width')}, h={geo.get('height')}")
