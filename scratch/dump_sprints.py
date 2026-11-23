import xml.etree.ElementTree as ET

def dump_sprint_info(path):
    print("=" * 60)
    print("SPRINT FILE:", path)
    print("=" * 60)
    root = ET.parse(path).getroot()
    cells = root.findall('.//mxCell')
    nodes = {c.get('id'): c for c in cells if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')}
    edges = [c for c in cells if c.get('edge') == '1']
    print(f"Classes ({len(nodes)}):")
    for nid, c in nodes.items():
        v = c.get('value', '').splitlines()
        print(f"  {nid}: {v[0]} ({v[1] if len(v) > 1 else ''})")
    print(f"\nEdges ({len(edges)}):")
    for e in edges:
        print(f"  {e.get('id')}: {e.get('source')} -> {e.get('target')} | val='{e.get('value', '')}'")

if __name__ == '__main__':
    for p in ['class-diagrams/Sprint1_Contract_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint3_Dispute_Management_Class_Diagram.drawio',
              'class-diagrams/Sprint4_Payment_Management_Class_Diagram.drawio']:
        dump_sprint_info(p)
