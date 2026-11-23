import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
root = tree.getroot()
nodes = {c.get('id'): c for c in root.findall('.//mxCell') if c.get('vertex') == '1'}

for e in root.findall('.//mxCell'):
    if e.get('edge') == '1':
        style = e.get('style', '')
        sid = e.get('source')
        tid = e.get('target')
        geo = e.find('mxGeometry')
        pts = []
        if geo is not None and geo.find('Array') is not None:
            pts = [(p.get('x'), p.get('y')) for p in geo.find('Array').findall('mxPoint')]
        if 'dto' in tid or 'type' in tid:
            tn = nodes.get(tid)
            tgeo = tn.find('mxGeometry')
            print(f"Edge {e.get('id')}: {sid} -> {tid}")
            print(f"   Target Box: x={tgeo.get('x')}, y={tgeo.get('y')}, w={tgeo.get('width')}, h={tgeo.get('height')}")
            print(f"   Style: {style}")
            print(f"   Points: {pts}")
