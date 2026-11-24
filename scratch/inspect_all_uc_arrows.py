import xml.etree.ElementTree as ET

for path in ['class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio',
              'class-diagrams/UC-25_Manage_Milestone_File_Class_Diagram.drawio',
              'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio']:
    print("=" * 60)
    print("FILE:", path)
    root = ET.parse(path).getroot()
    edges = [c for c in root.findall('.//mxCell') if c.get('edge') == '1']
    for e in edges:
        style = e.get('style', '')
        has_entry = 'entryX=' in style
        has_exit = 'exitX=' in style
        print(f"  {e.get('id')}: {e.get('source')} -> {e.get('target')} | has_exit={has_exit}, has_entry={has_entry}")
