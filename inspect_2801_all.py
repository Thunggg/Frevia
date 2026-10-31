import xml.etree.ElementTree as ET

with open('sequence-diagrams-remake/UC-28.01-view-user-list.drawio', 'r', encoding='utf-8') as f:
    text = f.read()

tree = ET.fromstring(text)
for cell in tree.iter('mxCell'):
    cid = cell.get('id', '')
    val = cell.get('value', '').replace('\n', ' ')
    geo = cell.find('mxGeometry')
    gx, gy, gw, gh = None, None, None, None
    if geo is not None:
        gx, gy, gw, gh = geo.get('x'), geo.get('y'), geo.get('width'), geo.get('height')
    v = cell.get('vertex')
    e = cell.get('edge')
    print(f"{cid:15} | v={v} e={e} | ({gx},{gy},{gw},{gh}) | {val[:40]}")

