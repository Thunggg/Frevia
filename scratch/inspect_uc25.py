import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
for d in tree.getroot().findall('.//diagram'):
    if d.get('name') == 'UC-25 Manage Milestone File':
        print(f"=== DIAGRAM: {d.get('name')} ===")
        for e in [c for c in d.findall('.//mxCell') if c.get('edge') == '1']:
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
            print(f"{e.get('id')}: {src} -> {tgt}")
            print(f"   pts: {pts}")
            print(f"   coords: {[p for p in style.split(';') if any(k in p for k in ['exitX', 'entryX', 'exitY', 'entryY'])]}")
