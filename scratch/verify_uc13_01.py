import xml.etree.ElementTree as ET

tree = ET.parse('sequence-diagrams-remake/ntin/UC-13.01-create-contract.drawio')
root = tree.getroot()
diagram = root.find('diagram')
print(f"Diagram: {diagram.get('name')}")
model = diagram.find('mxGraphModel')
root_cell = model.find('root')
cells = root_cell.findall('mxCell')
print(f"Total cells: {len(cells)}")

edges = [c for c in cells if c.get('edge') == '1']
vertices = [c for c in cells if c.get('vertex') == '1']
print(f"Vertices: {len(vertices)}, Edges: {len(edges)}")

print("\n--- Edge messages & coordinates ---")
for e in edges:
    val = e.get('value', '').replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('<br>', '\n      ')
    geo = e.find('mxGeometry')
    pts = []
    if geo is not None:
        arr = geo.find('Array')
        if arr is not None:
            for p in arr.findall('mxPoint'):
                pts.append((float(p.get('x')), float(p.get('y'))))
    print(f"{e.get('id')} (y={pts[0][1] if pts else '?'}): {val}")
