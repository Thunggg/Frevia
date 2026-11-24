import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.02-update-contract.drawio')
root = tree.getroot()
print('=== Lifelines in UC-13.02 ===')
for c in root.findall('.//mxCell'):
    style = c.get('style', '')
    val = c.get('value', '')
    if 'umlLifeline' in style or 'participant' in style or 'shape=umlActor' in style or 'cylinder' in style or 'db' in c.get('id'):
        geo = c.find('mxGeometry')
        gx = geo.get('x') if geo is not None else ''
        gy = geo.get('y') if geo is not None else ''
        gw = geo.get('width') if geo is not None else ''
        gh = geo.get('height') if geo is not None else ''
        print(f'{c.get("id")}: val="{val}" | x={gx}, y={gy}, w={gw}, h={gh} | style={style}')

print('\n=== Activation Bars in UC-13.02 ===')
for c in root.findall('.//mxCell'):
    if 'bar_' in c.get('id', ''):
        geo = c.find('mxGeometry')
        gx = geo.get('x') if geo is not None else ''
        gy = geo.get('y') if geo is not None else ''
        gw = geo.get('width') if geo is not None else ''
        gh = geo.get('height') if geo is not None else ''
        print(f'{c.get("id")}: x={gx}, y={gy}, w={gw}, h={gh} | style={c.get("style")}')
