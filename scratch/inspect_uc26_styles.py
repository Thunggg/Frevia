import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio')
root = tree.getroot()
nodes = {c.get('id'): c for c in root.findall('.//mxCell') if c.get('vertex') == '1'}

for e in root.findall('.//mxCell'):
    if e.get('edge') == '1':
        print(f"[{e.get('id')}] {e.get('source')} -> {e.get('target')}")
        print(f"   style: {e.get('style')}")
        geo = e.find('mxGeometry')
        if geo is not None:
            arr = geo.find('Array')
            if arr is not None:
                print(f"   pts: {[(p.get('x'), p.get('y')) for p in arr.findall('mxPoint')]}")
