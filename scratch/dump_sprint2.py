import xml.etree.ElementTree as ET

def dump_sprint2():
    path = 'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio'
    root = ET.parse(path).getroot()
    cells = root.findall('.//mxCell')
    nodes = {c.get('id'): c for c in cells if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')}
    edges = [c for c in cells if c.get('edge') == '1']
    print(f"Sprint 2 Classes ({len(nodes)}):")
    for nid, c in nodes.items():
        v = c.get('value', '').splitlines()
        print(f"  {nid}: {v[0]} ({v[1] if len(v) > 1 else ''})")
    print(f"\nSprint 2 Edges ({len(edges)}):")
    for e in edges:
        print(f"  {e.get('id')}: {e.get('source')} -> {e.get('target')} | val='{e.get('value', '')}'")

if __name__ == '__main__':
    dump_sprint2()
