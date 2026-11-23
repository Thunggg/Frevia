import xml.etree.ElementTree as ET

tree = ET.parse('class-diagrams/Sprint2_Milestone_Management_Class_Diagram.drawio')
root = tree.getroot()
diagrams = root.findall('.//diagram')
print(f"Sprint 2 Multi-page Diagram count: {len(diagrams)}")

for d in diagrams:
    dname = d.get('name')
    did = d.get('id')
    nodes = [c for c in d.findall('.//mxCell') if c.get('vertex') == '1' and 'swimlane' in c.get('style', '')]
    edges = [c for c in d.findall('.//mxCell') if c.get('edge') == '1']
    print(f"\n--- Tab: {dname} (id={did}) ---")
    print(f"  Classes: {len(nodes)}, Edges: {len(edges)}")
    
    # Check edges for horizontal entry into DTOs
    up_arrows = []
    for e in edges:
        style = e.get('style', '')
        # Check if entryX is horizontal
        if 'dto' in e.get('target', ''):
            has_entryX = 'entryX=' in style
            entryX_val = [p for p in style.split(';') if p.startswith('entryX=')]
            entryY_val = [p for p in style.split(';') if p.startswith('entryY=')]
            print(f"    {e.get('id')}: {e.get('source')} -> {e.get('target')} | {entryX_val} {entryY_val}")
