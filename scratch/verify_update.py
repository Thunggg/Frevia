import xml.etree.ElementTree as ET

for fname in ['class-diagrams/UC-24_Manage_Milestone_Class_Diagram.drawio', 'class-diagrams/UC-26_Manage_Milestone_Submission_Class_Diagram.drawio']:
    print(f"=== {fname} ===")
    tree = ET.parse(fname)
    for c in tree.getroot().findall('.//mxCell'):
        cid = c.get('id', '')
        if cid in ['sub_rel_contract_milestone', 'sub_rel_sub_subFile', 'sub_rel_milestone_sub', 'sub_rel_user_sub']:
            geo = c.find('mxGeometry')
            pts = []
            if geo is not None:
                arr = geo.find('Array')
                if arr is not None:
                    pts = [(p.get('x'), p.get('y')) for p in arr.findall('mxPoint')]
            print(f"  {cid}: val='{c.get('value')}' | pts={pts}")
            print(f"     style={c.get('style')}")
