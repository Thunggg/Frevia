import xml.etree.ElementTree as ET

for path in ['class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio',
              'class-diagrams/UC-25_Manage_Milestone_File_Class_Diagram.drawio',
              'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio']:
    print("=" * 60)
    print(path)
    root = ET.parse(path).getroot()
    nodes = {c.get('id'): c for c in root.findall('.//mxCell') if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')}
    edges = [c for c in root.findall('.//mxCell') if c.get('edge') == '1']
    print(f"Nodes ({len(nodes)}):")
    for nid, c in nodes.items():
        geo = c.find('mxGeometry')
        print(f"  {nid:25}: x={geo.get('x'):5}, y={geo.get('y'):5}, w={geo.get('width'):5}, h={geo.get('height'):5} | {c.get('value', '').splitlines()[0]}")
    print(f"Edges ({len(edges)}):")
    for e in edges:
        style = e.get('style', '')
        geo = e.find('mxGeometry')
        pts = []
        if geo is not None and geo.find('Array') is not None:
            pts = [(p.get('x'), p.get('y')) for p in geo.find('Array').findall('mxPoint')]
        print(f"  {e.get('id')}: {e.get('source')} -> {e.get('target')} | pts={pts}")
