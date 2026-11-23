import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
for d in tree.getroot().findall('.//diagram'):
    print(f"=== DIAGRAM: {d.get('name')} ===")
    cells = {c.get('id'): c for c in d.findall('.//mxCell')}
    edges = [c for c in cells.values() if c.get('edge') == '1']
    for e in edges:
        src = e.get('source')
        tgt = e.get('target')
        style = e.get('style', '')
        geo = e.find('mxGeometry')
        pts = []
        if geo is not None:
            pts_elem = geo.find('Array')
            if pts_elem is not None:
                for pt in pts_elem.findall('mxPoint'):
                    pts.append((float(pt.get('x')), float(pt.get('y'))))
        print(f"Edge {e.get('id')}: {src} -> {tgt}")
        print(f"   style: {style}")
        if pts:
            print(f"   pts: {pts}")
