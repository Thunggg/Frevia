import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.02-update-contract.drawio')
root = tree.getroot()
print('=== Sample edges in UC-13.02 ===')
for c in root.findall('.//mxCell'):
    if c.get('edge') == '1':
        geo = c.find('mxGeometry')
        pts = []
        if geo is not None:
            arr = geo.find('Array')
            if arr is not None:
                for p in arr.findall('mxPoint'):
                    pts.append((p.get('x'), p.get('y')))
        print(f"id={c.get('id')}, src={c.get('source')}, tgt={c.get('target')}, style={c.get('style')[:60]}, pts={pts}")
